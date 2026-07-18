require("dotenv").config();

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();

// Разрешаем фронтенду присылать данные на бэкенд
app.use(cors());
app.use(express.json());
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

const PORT = 3001; // Сделаем 3001, так как 3000 может быть занят Витом
app.listen(PORT, () => {
  console.log(`Бэкенд запущен на http://localhost:${PORT}`);
});
