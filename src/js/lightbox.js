(function () {
  const cards = document.querySelectorAll('.awards__card');
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const img = card.querySelector('.awards__card-img');
      if (img) openLightbox(img.src, img.alt);
    });
  });

  function openLightbox(src, alt) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Просмотр изображения');

    const img = document.createElement('img');
    img.className = 'lightbox__img';
    img.src = src;
    img.alt = alt || '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox__close';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => closeLightbox(overlay));

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox(overlay);
    });

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeLightbox(overlay);
        document.removeEventListener('keydown', onKeydown);
      }
    }
    document.addEventListener('keydown', onKeydown);

    overlay._onKeydown = onKeydown;
  }

  function closeLightbox(overlay) {
    document.removeEventListener('keydown', overlay._onKeydown);
    overlay.classList.add('is-closing');
    overlay.addEventListener('animationend', () => {
      overlay.remove();
      document.body.style.overflow = '';
    }, { once: true });
  }
})();
