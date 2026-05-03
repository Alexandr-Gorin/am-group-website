document.addEventListener('DOMContentLoaded', () => {
  const items = Array.from(document.querySelectorAll('.accordion__item'));

  if (!items.length) return;

  function openItem(item) {
    const body = item.querySelector('.accordion__body');
    const header = item.querySelector('.accordion__header');
    item.classList.add('is-open');
    header.setAttribute('aria-expanded', 'true');
    body.style.maxHeight = body.scrollHeight + 'px';
  }

  function closeItem(item) {
    const body = item.querySelector('.accordion__body');
    const header = item.querySelector('.accordion__header');
    item.classList.remove('is-open');
    header.setAttribute('aria-expanded', 'false');
    body.style.maxHeight = '0';
  }

  // Open first item on load
  openItem(items[0]);

  items.forEach(item => {
    item.querySelector('.accordion__header').addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach(closeItem);
      if (!isOpen) openItem(item);
    });
  });
});
