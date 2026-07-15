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

(function () {
  const icons = document.querySelectorAll('.news-share__icon');
  if (!icons.length) return;

  const rawUrl = window.location.href;
  const ogTitleEl = document.querySelector('meta[property="og:title"]');
  const rawTitle = ogTitleEl ? ogTitleEl.content : document.title;

  const url = encodeURIComponent(rawUrl);
  const title = encodeURIComponent(rawTitle);

  const links = {
    telegram: `https://t.me/share/url?url=${url}&text=${title}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(rawTitle + ' ' + rawUrl)}`,
    max: `https://max.ru/:share?text=${url}`,
    x: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
    vk: `https://vk.com/share.php?url=${url}&title=${title}`,
  };

  icons.forEach(function (icon) {
    var network = icon.dataset.network;
    if (links[network]) {
      icon.href = links[network];
    }
  });
})();
