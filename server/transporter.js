const nodemailer = require("nodemailer");

// Настройка почтового сервиса (SMTP)
// Давай пока настроим под Яндекс (если будет другая почта - поменяем)
const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
  auth: {
    user: "i@gorin-1.ru", // Почта-робот
    pass: "ТВОЙ_ПАРОЛЬ_ПРИЛОЖЕНИЯ", // Специальный пароль (не от входа)
  },
});
exports.transporter = transporter;
