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
app.post("/api/send-email", (req, res) => {
  // Получаем данные из формы (те самые name из HTML)
  const { name, phone, company, product_name, _subject } = req.body;

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
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Ошибка почты:", error);
      return res.status(500).json({ message: "Ошибка при отправке" });
    }
    console.log("Письмо отправлено: " + info.response);
    res.status(200).json({ message: "Успешно!" });
  });
});

const PORT = 3001; // Сделаем 3001, так как 3000 может быть занят Витом
app.listen(PORT, () => {
  console.log(`Бэкенд запущен на http://localhost:${PORT}`);
});
