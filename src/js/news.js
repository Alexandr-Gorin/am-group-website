(function () {
  const ITEMS_PER_PAGE = 3;
  const list = document.querySelector('.news-section__list');
  const items = list ? Array.from(list.querySelectorAll('.news-section__item')) : [];
  const prevBtn = document.querySelector('.news-section__btn--prev');
  const nextBtn = document.querySelector('.news-section__btn--next');

  if (!items.length || !prevBtn || !nextBtn) return;

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  let currentPage = 0;

  function updateItems(page) {
    items.forEach((item, i) => {
      const inPage = i >= page * ITEMS_PER_PAGE && i < (page + 1) * ITEMS_PER_PAGE;
      item.classList.toggle('is-hidden', !inPage);
    });
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page >= totalPages - 1;
    currentPage = page;
  }

  function goToPage(page) {
    if (page < 0 || page >= totalPages) return;
    list.classList.add('is-transitioning');
    setTimeout(() => {
      updateItems(page);
      list.classList.remove('is-transitioning');
    }, 250);
  }

  prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
  nextBtn.addEventListener('click', () => goToPage(currentPage + 1));

  updateItems(0);
})();
