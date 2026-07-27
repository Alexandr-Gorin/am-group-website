require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

const app = express();

app.set('trust proxy', '127.0.0.1');

// Разрешаем фронтенду присылать данные на бэкенд
app.use(cors());

// Capture raw body for webhook HMAC verification before JSON parsing consumes it
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf-8");
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Настройка почтового сервиса (SMTP)
const transporter = nodemailer.createTransport({
  host: "smtp.mail.ru",
  port: 465,
  secure: true,
  auth: {
    user: "thegorin_1@vk.com",
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Главный маршрут для отправки писем
app.post("/api/send-email", async (req, res) => {
  // Получаем данные из формы (те самые name из HTML)
  const { name, phone, company, product_name, _subject, marketing_consent, token } = req.body;

  // Проверка SmartCaptcha (если токен присутствует в теле — форма с капчей)
  if (token !== undefined) {
    if (!token) {
      return res.status(400).json({ message: "Captcha token missing" });
    }
    const ip = req.headers["x-real-ip"] || req.ip;
    try {
      const captchaRes = await fetch("https://smartcaptcha.yandexcloud.net/validate", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.SMARTCAPTCHA_SERVER_KEY,
          token: token,
          ip: ip,
        }),
      });
      const captchaData = await captchaRes.json();
      if (captchaData.status !== "ok") {
        return res.status(400).json({ message: "Captcha validation failed" });
      }
    } catch (err) {
      console.error("Captcha verification error:", err);
      return res.status(500).json({ message: "Captcha verification error" });
    }
  }

  const mailOptions = {
    from: '"AM Group AI Robot" <thegorin_1@vk.com>',
    to: "info@microbio.pro", // Почта клиента
    subject: _subject || "Новая заявка с сайта",
    html: `
      <h2>Новая заявка с сайта AM Group</h2>
      <p><b>Имя:</b> ${name}</p>
      <p><b>Телефон:</b> ${phone}</p>
      <p><b>Компания:</b> ${company}</p>
      <p><b>Интересует:</b> ${product_name}</p>
      <p><b>Согласие на рассылку:</b> ${marketing_consent === "yes" ? "Да" : "Нет"}</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Письмо отправлено: " + info.response);
    res.status(200).json({ message: "Успешно!" });
  } catch (error) {
    console.error("Ошибка почты:", error);
    res.status(500).json({ message: "Ошибка при отправке" });
  }
});

// ---------------------------------------------------------------------------
// Sanity Presentation tool preview — GET /api/preview-data
// ---------------------------------------------------------------------------

const PREVIEW_CLIENT_SECRET = "amg-preview-2026";
const SANITY_PREVIEW_TOKEN = process.env.SANITY_PREVIEW_TOKEN;

app.get("/api/preview-data", async (req, res) => {
  if (req.query.secret !== PREVIEW_CLIENT_SECRET) {
    return res.status(403).json({ error: "Invalid secret" });
  }
  if (!SANITY_PREVIEW_TOKEN) {
    console.warn("[preview] SANITY_PREVIEW_TOKEN not set in server/.env");
    return res.status(503).json({ error: "Preview not configured" });
  }

  const page = req.query.page || 'home';

  let query;
  if (page === 'catalog') {
    query = `{
      "categories": *[_type == "category"] | order(order asc){ title, filterKey, "iconUrl": icon.asset->url },
      "products": *[_type == "product"] | order(category->order asc, title asc){
        title, "slug": slug.current, filterTags, shortDescription, buttonType,
        "mainImage": mainImage[0]
      }
    }`;
  } else {
    query = `{
      "hero": *[_type == "homeHero"][0]{heading, subheading, buttonText, bannerImage},
      "partnership": *[_type == "partnershipSection"][0]{heading, subheading, buttonText},
      "faqSection": *[_type == "faqSection"][0]{heading},
      "faqItems": *[_type == "faqItem"] | order(order asc){question, answer},
      "contact": *[_type == "contactSection"][0]{
        heading, subheading, buttonText, consentText, newsletterText, backgroundImage
      }
    }`;
  }

  try {
    const sanityRes = await fetch(
      "https://b33hwgh0.api.sanity.io/v2024-01-01/data/query/production",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SANITY_PREVIEW_TOKEN}`,
        },
        body: JSON.stringify({ query, perspective: "previewDrafts" }),
      }
    );

    if (!sanityRes.ok) {
      const text = await sanityRes.text();
      console.error("[preview] Sanity API error:", sanityRes.status, text);
      return res.status(502).json({ error: "Sanity API error" });
    }

    const json = await sanityRes.json();
    res.json(json.result);
  } catch (err) {
    console.error("[preview] Fetch error:", err.message);
    res.status(500).json({ error: "Internal error" });
  }
});

// ---------------------------------------------------------------------------
// Sanity webhook — POST /webhook/sanity-deploy
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;
const DEPLOY_LOCK = "/tmp/am-group-deploy.lock";
const LOG_DIR = "/var/log/am-group-deploy";
const PROJECT_DIR = "/var/www/am-group-website";

function isValidSanitySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;

  // Header format: t=<unix_timestamp_ms>,v1=<base64url_hmac>
  const commaIdx = signature.indexOf(",");
  if (commaIdx === -1) return false;
  const tPart = signature.slice(0, commaIdx);
  const v1Part = signature.slice(commaIdx + 1);
  if (!tPart.startsWith("t=") || !v1Part.startsWith("v1=")) return false;

  const timestamp = parseInt(tPart.slice(2), 10);
  const providedHash = v1Part.slice(3);

  // Replay protection: reject signatures older than 5 minutes
  const ageMs = Math.abs(Date.now() - timestamp);
  if (ageMs > 5 * 60 * 1000) {
    console.warn(`[webhook] Rejected stale signature (age: ${Math.floor(ageMs / 1000)}s)`);
    return false;
  }

  // Sanity signs: HMAC-SHA256(secret, `${timestamp}.${rawBody}`) — dot separator
  const expectedBuf = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest();

  try {
    return crypto.timingSafeEqual(
      expectedBuf,
      Buffer.from(providedHash, "base64url")
    );
  } catch {
    return false;
  }
}

function appendLog(logFile, msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch {}
  console.log("[deploy]", msg);
}

async function runDeploy() {
  const ts = Date.now();
  const logFile = path.join(
    LOG_DIR,
    `deploy-${new Date().toISOString().replace(/[:.]/g, "-")}.log`
  );
  const newDistDir = path.join(PROJECT_DIR, `dist_new_${ts}`);
  const oldDistDir = path.join(PROJECT_DIR, `dist_old_${ts}`);
  const liveDistDir = path.join(PROJECT_DIR, "dist");

  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {}

  const log = (msg) => appendLog(logFile, msg);

  const run = async (cmd) => {
    log(`> ${cmd}`);
    try {
      const { stdout, stderr } = await execAsync(cmd, {
        cwd: PROJECT_DIR,
        env: { ...process.env, HOME: "/root" },
      });
      if (stdout.trim()) log(stdout.trim());
      if (stderr.trim()) log(`[stderr] ${stderr.trim()}`);
    } catch (err) {
      log(`FAILED: ${cmd}`);
      log(err.stderr ? err.stderr.trim() : err.message);
      throw err;
    }
  };

  let swapDone = false;

  try {
    log("=== Deploy started ===");

    // 1. git pull
    await run("git pull origin main");

    // 2. npm install only if package files changed in this pull
    let pkgChanged = false;
    try {
      const { stdout } = await execAsync(
        "git diff --name-only ORIG_HEAD HEAD -- package.json package-lock.json",
        { cwd: PROJECT_DIR }
      );
      pkgChanged = stdout.trim().length > 0;
    } catch {
      pkgChanged = true; // if unsure, install to be safe
    }
    if (pkgChanged) {
      log("package files changed — running npm install");
      await run("npm install");
    } else {
      log("package files unchanged — skipping npm install");
    }

    // 3. Build to temp dir (never touches live dist/)
    log(`Building to ${newDistDir}`);
    await run(`npm run build -- --outDir ${newDistDir} --emptyOutDir`);

    // 4. Atomic swap: rename old dist aside, rename new into place
    log("Swapping dist directories");
    fs.renameSync(liveDistDir, oldDistDir);
    fs.renameSync(newDistDir, liveDistDir);
    swapDone = true;

    // 5. Recreate pages symlink in the new live dist
    const pagesSymlink = path.join(liveDistDir, "pages");
    const pagesTarget = path.join(liveDistDir, "src", "pages");
    try { fs.unlinkSync(pagesSymlink); } catch {}
    fs.symlinkSync(pagesTarget, pagesSymlink);
    log("Pages symlink recreated");

    // 6. Remove old dist
    await run(`rm -rf ${oldDistDir}`);
    log("=== Deploy complete ===");

  } catch (err) {
    log(`=== Deploy FAILED: ${err.message} ===`);

    // Safety net: if swap started but new dist never landed, restore old
    if (swapDone && !fs.existsSync(liveDistDir) && fs.existsSync(oldDistDir)) {
      try {
        fs.renameSync(oldDistDir, liveDistDir);
        log("Restored previous dist after failed swap");
      } catch (restoreErr) {
        log(`CRITICAL: could not restore dist — ${restoreErr.message}`);
      }
    }

    // Remove partial new dist if it exists
    try { fs.rmSync(newDistDir, { recursive: true, force: true }); } catch {}

  } finally {
    try { fs.unlinkSync(DEPLOY_LOCK); } catch {}
    log("Lock released");
  }
}

app.post("/webhook/sanity-deploy", (req, res) => {
  // 1. Verify Sanity HMAC signature
  const signature = req.headers["sanity-webhook-signature"];
  if (!isValidSanitySignature(req.rawBody, signature, WEBHOOK_SECRET)) {
    console.warn(`[webhook] Invalid/missing signature from ${req.headers['x-real-ip'] || req.ip}`);
    return res.status(401).json({ error: "Invalid signature" });
  }

  // 2. Acquire lock (atomic: throws if file already exists)
  try {
    fs.openSync(DEPLOY_LOCK, "wx");
  } catch {
    console.log("[webhook] Deploy already in progress — ignoring duplicate call");
    return res.status(503).json({ message: "Deploy in progress, retry later" });
  }

  // 3. Respond immediately so Sanity doesn't time out waiting
  res.status(200).json({ message: "Deploy started" });

  // 4. Run the deploy asynchronously (lock is released in finally block)
  runDeploy().catch((err) => {
    console.error("[webhook] Unhandled deploy error:", err.message);
    try { fs.unlinkSync(DEPLOY_LOCK); } catch {}
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Бэкенд запущен на http://localhost:${PORT}`);
});
