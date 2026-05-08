/Скроллинг header/;
const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
  if (window.scrollY > 0) {
    header.classList.add("header--scrolled");
  } else {
    header.classList.remove("header--scrolled");
  }
});

/Burger menu/;
const burgerBtn = document.querySelector(".burger");
const burgerMenu = document.querySelector(".burger-menu");
const burgerLinks = document.querySelectorAll(".burger-menu__link");

/Burger menu header/;
const burgerIcon = `<svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect y="0" width="60" height="4" rx="2" fill="currentColor"/>
  <rect y="20" width="60" height="4" rx="2" fill="currentColor"/>
</svg>`;

const closeIcon = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <line x1="12" y1="12" x2="48" y2="48" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="48" y1="12" x2="12" y2="48" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
</svg>`;

function openMenu() {
  burgerMenu.classList.add("is-open");
  burgerBtn.innerHTML = closeIcon;
  burgerBtn.classList.add("burger--close");
  burgerBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("burger-open");
}

function closeMenu() {
  burgerMenu.classList.remove("is-open");
  burgerBtn.innerHTML = burgerIcon;
  burgerBtn.classList.remove("burger--close");
  burgerBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("burger-open");
}

burgerBtn?.addEventListener("click", () => {
  if (burgerMenu.classList.contains("is-open")) {
    closeMenu();
  } else {
    openMenu();
  }
});

burgerLinks.forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && burgerMenu.classList.contains("is-open")) {
    closeMenu();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 940 && burgerMenu?.classList.contains("is-open")) {
    closeMenu();
  }
});

// Popup modal
const popup = document.getElementById("popup");
const popupVacancy = document.getElementById("popup-vacancy"); // Добавили новый попап
const popupClose = document.getElementById("popup-close");
const popupVacancyClose = document.getElementById("popup-vacancy-close"); // Закрытие для вакансий

// Универсальная функция открытия (принимает конкретный элемент)
function openPopup(targetPopup) {
  if (!targetPopup) return;
  targetPopup.classList.add("is-open");
  targetPopup.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// Функция закрытия (закрывает все открытые попапы)
function closePopup() {
  const openPopups = document.querySelectorAll(".popup.is-open");
  openPopups.forEach((p) => {
    p.classList.remove("is-open");
    p.setAttribute("aria-hidden", "true");
  });
  document.body.style.overflow = "";
}

// 1. Слушатель для ОБЫЧНЫХ кнопок (data-popup="open")
document.querySelectorAll('[data-popup="open"]').forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openPopup(popup);
  });
});

// 2. Слушатель для кнопок ВАКАНСИЙ (data-popup="vacancy")
document.querySelectorAll('[data-popup="vacancy"]').forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openPopup(popupVacancy);
  });
});

// Логика отправки основной формы
const popupForm = popup?.querySelector(".popup__form");
popupForm?.addEventListener("submit", function (e) {
  e.preventDefault();
  closePopup();
  window.location.href = "/src/pages/feedback.html";
});

// Логика отправки формы вакансий (если нужно перенаправление на другую страницу, поменяй путь)
const vacancyForm = popupVacancy?.querySelector(".popup__form");
vacancyForm?.addEventListener("submit", function (e) {
  e.preventDefault();
  closePopup();
  window.location.href = "/src/pages/feedback.html";
});

// Закрытие по клику на оверлей (фон) для обоих окон
[popup, popupVacancy].forEach((modal) => {
  modal?.addEventListener("click", function (e) {
    if (e.target === this) closePopup();
  });
});

// Кнопки закрытия (крестики)
popupClose?.addEventListener("click", closePopup);
popupVacancyClose?.addEventListener("click", closePopup);

// Закрытие на Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closePopup();
  }
});

// Cookie banner
const cookieBanner = document.getElementById("cookie-banner");
const cookieAcceptBtn = document.getElementById("cookie-accept");

if (cookieBanner && cookieAcceptBtn) {
  if (!localStorage.getItem("cookieAccepted")) {
    cookieBanner.classList.remove("hidden");
  }

  cookieAcceptBtn.addEventListener("click", () => {
    localStorage.setItem("cookieAccepted", "true");
    cookieBanner.classList.add("hidden");
  });
}

/Увеличение фото по клику в hero/;
document.addEventListener("DOMContentLoaded", () => {
  const heroImg = document.querySelector(".hero__image");

  if (heroImg) {
    heroImg.addEventListener("click", () => {
      heroImg.classList.toggle("hero__image--full");

      // Блокируем скролл основной страницы
      if (heroImg.classList.contains("hero__image--full")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });
  }
});
