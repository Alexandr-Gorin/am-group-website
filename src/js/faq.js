function initAccordion(itemSelector, questionSelector) {
  const items = document.querySelectorAll(itemSelector);
  if (!items.length) return;

  items.forEach(item => {
    const button = item.querySelector(questionSelector);
    if (!button) return;

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      items.forEach(other => {
        other.classList.remove('is-open');
        const q = other.querySelector(questionSelector);
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

initAccordion('.faq-section__item', '.faq-section__question');
initAccordion('.useful-materials__item', '.useful-materials__question');
