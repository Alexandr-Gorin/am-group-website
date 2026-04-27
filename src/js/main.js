/Скроллинг header/  
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    header.classList.add('header--scrolled');
  } else {
    header.classList.remove('header--scrolled');
  }
});  

/Burger menu/ 
const burgerBtn   = document.querySelector('.burger');
const burgerMenu  = document.querySelector('.burger-menu');
const burgerLinks = document.querySelectorAll('.burger-menu__link');

/Burger menu header/  
const burgerIcon = `<svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect y="0" width="60" height="4" rx="2" fill="currentColor"/>
  <rect y="20" width="60" height="4" rx="2" fill="currentColor"/>
</svg>`;

const closeIcon = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <line x1="12" y1="12" x2="48" y2="48" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  <line x1="48" y1="12" x2="12" y2="48" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
</svg>`;

function openMenu() {
  burgerMenu.classList.add('is-open');
  burgerBtn.innerHTML = closeIcon; 
  burgerBtn.classList.add('burger--close');
  burgerBtn.setAttribute('aria-expanded', 'true');
  document.body.classList.add('burger-open');
}

function closeMenu() {
  burgerMenu.classList.remove('is-open');
  burgerBtn.innerHTML = burgerIcon;
  burgerBtn.classList.remove('burger--close');       
  burgerBtn.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('burger-open');
} 

burgerBtn?.addEventListener('click', () => {
  if (burgerMenu.classList.contains('is-open')) {
    closeMenu();
  } else {
    openMenu();
  }
});

burgerLinks.forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && burgerMenu.classList.contains('is-open')) {
    closeMenu();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth >= 940 && burgerMenu?.classList.contains('is-open')) {
    closeMenu();
  }
});