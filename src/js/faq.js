const faqItems = document.querySelectorAll('.faq-section__item');

faqItems.forEach(item => {
  const button = item.querySelector('.faq-section__question');

  button.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');

    faqItems.forEach(other => {
      other.classList.remove('is-open');
      other.querySelector('.faq-section__question').setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});
