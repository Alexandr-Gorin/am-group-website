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
const popupClose = document.getElementById("popup-close");

function openPopup() {
  if (!popup) return;
  popup.classList.add("is-open");
  popup.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePopup() {
  if (!popup) return;
  popup.classList.remove("is-open");
  popup.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll('[data-popup="open"]').forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openPopup();
  });
});

const popupForm = popup?.querySelector(".popup__form");
popupForm?.addEventListener("submit", function (e) {
  e.preventDefault();
  closePopup();
  window.location.href = "/src/pages/feedback.html";
});

document.getElementById("popup").addEventListener("click", function (e) {
  if (e.target === this) closePopup();
});
popupClose?.addEventListener("click", closePopup);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && popup?.classList.contains("is-open")) {
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
