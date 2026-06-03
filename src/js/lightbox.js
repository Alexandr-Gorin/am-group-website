(function () {
  const cards = document.querySelectorAll('.awards__card');
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const img = card.querySelector('.awards__card-img');
      if (!img) return;

      const groupName = img.dataset.lightboxGroup;
      let gallery, startIndex;

      if (groupName) {
        const groupImgs = Array.from(
          document.querySelectorAll(`.awards__card-img[data-lightbox-group="${groupName}"]`)
        );
        gallery = groupImgs.map((i) => ({ src: i.src, alt: i.alt }));
        startIndex = groupImgs.indexOf(img);
      } else {
        gallery = [{ src: img.src, alt: img.alt }];
        startIndex = 0;
      }

      openLightbox(gallery, startIndex);
    });
  });

  function openLightbox(gallery, startIndex) {
    let currentIndex = startIndex;
    const total = gallery.length;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Просмотр изображения');

    const imgEl = document.createElement('img');
    imgEl.className = 'lightbox__img';
    imgEl.src = gallery[currentIndex].src;
    imgEl.alt = gallery[currentIndex].alt || '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox__close';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => closeLightbox(overlay));

    overlay.appendChild(imgEl);
    overlay.appendChild(closeBtn);

    let prevBtn, nextBtn, counter;

    if (total > 1) {
      prevBtn = document.createElement('button');
      prevBtn.className = 'lightbox__nav lightbox__nav--prev';
      prevBtn.setAttribute('aria-label', 'Предыдущее изображение');
      prevBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      prevBtn.addEventListener('click', () => navigate(-1));

      nextBtn = document.createElement('button');
      nextBtn.className = 'lightbox__nav lightbox__nav--next';
      nextBtn.setAttribute('aria-label', 'Следующее изображение');
      nextBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      nextBtn.addEventListener('click', () => navigate(1));

      counter = document.createElement('div');
      counter.className = 'lightbox__counter';

      overlay.appendChild(prevBtn);
      overlay.appendChild(nextBtn);
      overlay.appendChild(counter);

      // Touch swipe: horizontal >= 50px and dominant over vertical
      let touchStartX = 0;
      let touchStartY = 0;

      overlay.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      overlay.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) {
          navigate(dx < 0 ? 1 : -1);
        }
      }, { passive: true });

      updateNav();
    }

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeLightbox(overlay);
    });

    function onKeydown(e) {
      if (e.key === 'Escape') {
        closeLightbox(overlay);
        document.removeEventListener('keydown', onKeydown);
      } else if (total > 1) {
        if (e.key === 'ArrowLeft') navigate(-1);
        else if (e.key === 'ArrowRight') navigate(1);
      }
    }
    document.addEventListener('keydown', onKeydown);
    overlay._onKeydown = onKeydown;

    function navigate(direction) {
      const newIndex = currentIndex + direction;
      if (newIndex < 0 || newIndex >= total) return;
      currentIndex = newIndex;
      imgEl.src = gallery[currentIndex].src;
      imgEl.alt = gallery[currentIndex].alt || '';
      updateNav();
    }

    function updateNav() {
      const atFirst = currentIndex === 0;
      const atLast = currentIndex === total - 1;
      prevBtn.disabled = atFirst;
      prevBtn.classList.toggle('is-disabled', atFirst);
      nextBtn.disabled = atLast;
      nextBtn.classList.toggle('is-disabled', atLast);
      counter.textContent = `${currentIndex + 1} / ${total}`;
    }
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
