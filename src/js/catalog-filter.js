document.addEventListener('DOMContentLoaded', () => {
  const cards = Array.from(document.querySelectorAll('.card[data-category]'));
  const filterBtns = Array.from(document.querySelectorAll('[data-filter]'));
  const grid = document.querySelector('.cards-grid');

  if (!grid || !cards.length) return;

  function getFilterFromHash() {
    return window.location.hash.slice(1) || 'all';
  }

  function setActiveBtn(filter) {
    const activeFilter = (filter === 'seeds' || filter === 'plants') ? 'soil' : filter;
    filterBtns.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.filter === activeFilter);
    });
  }

  function applyFilter(filter, animate) {
    setActiveBtn(filter);

    if (!animate) {
      cards.forEach(card => {
        const cats = (card.dataset.category || '').split(' ');
        const matches = filter === 'all' || cats.includes(filter);
        card.classList.toggle('is-hidden', !matches);
        if (!matches) card.style.display = 'none';
      });
      return;
    }

    // Fade out all currently visible cards simultaneously
    cards.forEach(card => {
      if (card.style.display !== 'none') {
        card.classList.add('is-hidden');
      }
    });

    // After fade-out completes, reveal matching cards
    setTimeout(() => {
      cards.forEach(card => {
        const cats = (card.dataset.category || '').split(' ');
        const matches = filter === 'all' || cats.includes(filter);
        if (matches) {
          card.style.display = '';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              card.classList.remove('is-hidden');
            });
          });
        } else {
          card.style.display = 'none';
        }
      });
    }, 350);
  }

  // After fade-out completes, set display:none to collapse grid space
  grid.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'opacity') return;
    const card = e.target.closest('.card');
    if (card && card.classList.contains('is-hidden')) {
      card.style.display = 'none';
    }
  });

  // Click handler — prevent href scroll, apply filter, update hash
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = btn.dataset.filter;
      history.replaceState(null, '', filter === 'all' ? '#all' : '#' + filter);
      applyFilter(filter, true);
      // Mobile only: scroll down to the cards grid
      if (window.innerWidth < 660) {
        const y = grid.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // Mobile: "back to categories" button scrolls up to panel cards
  const backBtn = document.querySelector('.back-to-categories');
  const panelCards = document.querySelector('.panel-cards');
  if (backBtn && panelCards) {
    backBtn.addEventListener('click', () => {
      panelCards.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Browser back/forward navigation
  window.addEventListener('hashchange', () => {
    applyFilter(getFilterFromHash(), true);
  });

  // Apply filter on load without animation
  applyFilter(getFilterFromHash(), false);
});
