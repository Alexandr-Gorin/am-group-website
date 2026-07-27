// Preview mode for Sanity Studio's Presentation tool.
// Activates when ?preview=amg-preview-2026 is present in the URL, or when the
// session flag is set (so navigation within the Studio iframe persists).
// Draft data is fetched through /api/preview-data (server-side proxy) — no Sanity
// token ever lands in the client bundle.
//
// Pages supported:
//   homepage  — heading, subheading, buttonText, bannerImage; partnership; FAQ; contact
//   catalog   — panel cards (categories with inline SVG icons) + product grid

const PREVIEW_SECRET = 'amg-preview-2026';
const PREVIEW_SS_KEY = '__amg_preview';

// Persist preview activation across page navigations within the Studio iframe
const isPreviewParam =
  new URLSearchParams(window.location.search).get('preview') === PREVIEW_SECRET;
if (isPreviewParam) {
  sessionStorage.setItem(PREVIEW_SS_KEY, '1');
}
const isPreview = isPreviewParam || sessionStorage.getItem(PREVIEW_SS_KEY) === '1';

const pathname = window.location.pathname;
const isHomepage = pathname === '/' || pathname === '/index.html';
const isCatalog = pathname.includes('catalog');

if (isPreview && isHomepage) {
  activatePreviewHome().catch((err) => console.error('[preview-mode]', err));
}
if (isPreview && isCatalog) {
  activatePreviewCatalog().catch((err) => console.error('[preview-mode]', err));
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanityImgUrl(imageRef, w = 1200) {
  const ref = imageRef?.asset?._ref;
  if (!ref) return null;
  // ref format: image-<hash>-<WxH>-<ext>
  const parts = ref.split('-');
  const ext = parts[parts.length - 1];
  const dims = parts[parts.length - 2];
  const hash = parts.slice(1, -2).join('-');
  return `https://cdn.sanity.io/images/b33hwgh0/production/${hash}-${dims}.${ext}?auto=format&w=${w}`;
}

function setHtml(attr, html) {
  const el = document.querySelector(`[data-sanity="${attr}"]`);
  if (el && html != null) el.innerHTML = html;
}

function setSrc(attr, url) {
  const el = document.querySelector(`[data-sanity="${attr}"]`);
  if (el && url) el.setAttribute('src', url);
}

// ─── Homepage helpers ─────────────────────────────────────────────────────────

function renderSpans(block, linkClass) {
  const defs = block.markDefs || [];
  return (block.children || [])
    .map((span) => {
      if (span._type !== 'span') return '';
      let html = esc(span.text || '');
      for (const mark of span.marks || []) {
        const def = defs.find((d) => d._key === mark);
        if (def?._type === 'link') {
          const cls = linkClass ? ` class="${esc(linkClass)}"` : '';
          html = `<a href="${esc(def.href || '#')}"${cls} target="_blank" rel="noopener noreferrer">${html}</a>`;
        }
      }
      return html;
    })
    .join('');
}

function portableToHtml(blocks, linkClass) {
  if (!Array.isArray(blocks) || !blocks.length) return '';
  const result = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block._type !== 'block') {
      i++;
      continue;
    }
    if (block.listItem === 'bullet') {
      const liItems = [];
      while (
        i < blocks.length &&
        blocks[i]._type === 'block' &&
        blocks[i].listItem === 'bullet'
      ) {
        liItems.push(`<li>${renderSpans(blocks[i], linkClass)}</li>`);
        i++;
      }
      result.push(`<ul>${liItems.join('')}</ul>`);
    } else {
      result.push(`<p>${renderSpans(block, linkClass)}</p>`);
      i++;
    }
  }
  return result.join('');
}

function renderFaqItem(item, index) {
  const id = `faq-preview-${index + 1}`;
  const answerHtml = portableToHtml(item.answer ?? [], null);
  return `<li class="faq-section__item">
    <hr class="faq-section__divider" />
    <button class="faq-section__question" aria-expanded="false" aria-controls="${id}">
      <span class="faq-section__question-text">${esc(item.question ?? '')}</span>
      <span class="faq-section__icon" aria-hidden="true"></span>
    </button>
    <div id="${id}" class="faq-section__answer-wrapper">
      <div class="faq-section__answer">
        <div class="faq-section__answer-inner">${answerHtml}</div>
      </div>
    </div>
  </li>`;
}

function reinitFaqAccordion() {
  const items = document.querySelectorAll('.faq-section__item');
  items.forEach((item) => {
    const btn = item.querySelector('.faq-section__question');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach((other) => {
        other.classList.remove('is-open');
        const q = other.querySelector('.faq-section__question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// ─── Catalog helpers ──────────────────────────────────────────────────────────

const PANEL_ARROW_SVG = `<svg class="button__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18.4141 13.0001L13.7071 8.29309C13.6142 8.20025 13.504 8.1266 13.3827 8.07635C13.2614 8.02611 13.1314 8.00024 13.0001 8.00024C12.8688 8.00024 12.7387 8.02611 12.6174 8.07635C12.4961 8.1266 12.3859 8.20025 12.2931 8.29309C12.2002 8.38594 12.1266 8.49616 12.0763 8.61747C12.0261 8.73878 12.0002 8.86879 12.0002 9.00009C12.0002 9.1314 12.0261 9.26141 12.0763 9.38272C12.1266 9.50403 12.2002 9.61425 12.2931 9.70709L14.5861 12.0001H7.00006C6.73485 12.0001 6.48049 12.1055 6.29296 12.293C6.10542 12.4805 6.00006 12.7349 6.00006 13.0001C6.00006 13.2653 6.10542 13.5197 6.29296 13.7072C6.48049 13.8947 6.73485 14.0001 7.00006 14.0001H14.5861L12.2931 16.2931C12.1999 16.3857 12.1259 16.4959 12.0755 16.6172C12.025 16.7386 11.999 16.8687 11.999 17.0001C11.999 17.1315 12.025 17.2616 12.0755 17.3829C12.1259 17.5043 12.1999 17.6144 12.2931 17.7071C12.4806 17.8946 12.7349 17.9999 13.0001 17.9999C13.2652 17.9999 13.5195 17.8946 13.7071 17.7071L18.4141 13.0001Z" fill="currentColor"/></svg>`;

// Strips fill attributes and adds the panel-card class so SVG inherits currentColor from CSS
function processSvgForPreview(svgText) {
  let s = svgText
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+fill="(?!none")[^"]*"/g, '')
    .trim();
  s = s.replace(/^<svg([^>]*)>/i, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s*class="[^"]*"/g, '')
      .replace(/\s*aria-hidden="[^"]*"/g, '');
    return `<svg${cleaned} class="panel-card__icon-svg" aria-hidden="true">`;
  });
  return s;
}

function normalizeFilterTags(filterTags) {
  return (filterTags || []).flatMap((t) => t.split(',').map((s) => s.trim())).filter(Boolean);
}

function renderPreviewPanelCard(category, svgMarkup) {
  const key = esc(category.filterKey);
  const title = esc(category.title);
  return `<a href="#${key}" data-filter="${key}" class="panel-card">
        <p class="panel-card__title">${title}</p>
        <div class="panel-card__icon">
          ${svgMarkup}
        </div>
        <button class="button button--ghost" tabindex="-1">
          Подробнее
          ${PANEL_ARROW_SVG}
        </button>
      </a>`;
}

function renderPreviewCatalogCard(product) {
  const tags = normalizeFilterTags(product.filterTags);
  const dataCategory = esc(tags.join(' '));
  const slug = esc(product.slug);
  const title = esc(product.title);
  const desc = esc(product.shortDescription || '');
  const buttonType = product.buttonType === 'secondary' ? 'secondary' : 'primary';
  const imageUrl = sanityImgUrl(product.mainImage, 600);
  const imgTag = imageUrl
    ? `<img class="card__image" src="${esc(imageUrl)}" alt="${title}" />`
    : '';
  return `<article class="card" data-category="${dataCategory}">
                <div class="card__image-wrapper">
                  ${imgTag}
                </div>
                <div class="card__content">
                  <h3 class="card__title">${title}</h3>
                  <p class="card__description">${desc}</p>
                </div>
                <a href="product-${slug}" class="button button--${buttonType}">Подробнее</a>
              </article>`;
}

// ─── Homepage preview ─────────────────────────────────────────────────────────

async function activatePreviewHome() {
  console.log('[preview-mode] Fetching draft content via /api/preview-data…');

  const res = await fetch(`/api/preview-data?secret=${PREVIEW_SECRET}`);
  if (!res.ok) {
    console.error('[preview-mode] Server returned', res.status, await res.text());
    return;
  }

  const data = await res.json();

  // Hero
  const hero = data?.hero;
  if (hero) {
    if (hero.heading) setHtml('heading', esc(hero.heading));
    if (hero.subheading) setHtml('subheading', esc(hero.subheading));
    if (hero.buttonText) setHtml('buttonText', esc(hero.buttonText));
    if (hero.bannerImage) setSrc('bannerImage', sanityImgUrl(hero.bannerImage, 1200));
  }

  // Partnership
  const p = data?.partnership;
  if (p) {
    if (p.heading) setHtml('partnershipHeading', esc(p.heading));
    if (p.subheading) setHtml('partnershipSubheading', esc(p.subheading));
    if (p.buttonText) setHtml('partnershipButtonText', esc(p.buttonText));
  }

  // FAQ heading
  if (data?.faqSection?.heading) setHtml('faqHeading', esc(data.faqSection.heading));

  // FAQ items — full re-render + re-init accordion
  if (data?.faqItems?.length) {
    const listEl = document.querySelector('[data-sanity="faqList"]');
    if (listEl) {
      listEl.innerHTML = data.faqItems.map((item, i) => renderFaqItem(item, i)).join('');
      reinitFaqAccordion();
    }
  }

  // Contact section
  const c = data?.contact;
  if (c) {
    if (c.heading) setHtml('contactHeading', esc(c.heading));
    if (c.subheading) setHtml('contactSubheading', esc(c.subheading));
    if (c.buttonText) setHtml('contactButtonText', esc(c.buttonText));
    if (c.newsletterText) setHtml('contactNewsletterText', esc(c.newsletterText));
    if (c.backgroundImage) setSrc('contactBgImage', sanityImgUrl(c.backgroundImage, 1920));
    if (Array.isArray(c.consentText) && c.consentText.length) {
      const el = document.querySelector('[data-sanity="contactConsentText"]');
      if (el) {
        // Strip wrapping <p> tags since the target element is already a <p>
        const rendered = portableToHtml(c.consentText, 'form-consent__link').replace(
          /<\/?p>/g,
          '',
        );
        el.innerHTML = rendered;
      }
    }
  }

  console.log('[preview-mode] Done — homepage DOM patched with draft content.');
}

// ─── Catalog preview ──────────────────────────────────────────────────────────

async function activatePreviewCatalog() {
  console.log('[preview-mode] Fetching catalog draft content via /api/preview-data?page=catalog…');

  const res = await fetch(`/api/preview-data?secret=${PREVIEW_SECRET}&page=catalog`);
  if (!res.ok) {
    console.error('[preview-mode] Server returned', res.status, await res.text());
    return;
  }

  const data = await res.json();

  // Panel cards — fetch and inline SVG icons in parallel for correct currentColor theming
  if (Array.isArray(data.categories) && data.categories.length) {
    const panelEl = document.querySelector('[data-sanity="catalogPanelCards"]');
    if (panelEl) {
      const cardsHtml = await Promise.all(
        data.categories.map(async (cat) => {
          let svgMarkup = '';
          if (cat.iconUrl) {
            try {
              const svgRes = await fetch(cat.iconUrl);
              if (svgRes.ok) {
                svgMarkup = processSvgForPreview(await svgRes.text());
              }
            } catch {}
          }
          return renderPreviewPanelCard(cat, svgMarkup);
        }),
      );
      panelEl.innerHTML = cardsHtml.join('');
    }
  }

  // Product grid
  if (Array.isArray(data.products) && data.products.length) {
    const gridEl = document.querySelector('[data-sanity="catalogGrid"]');
    if (gridEl) {
      gridEl.innerHTML = data.products.map(renderPreviewCatalogCard).join('');
    }
  }

  // Reinitialize catalog filter with the new DOM nodes
  document.dispatchEvent(new CustomEvent('catalog:reinit'));

  console.log('[preview-mode] Done — catalog DOM patched with draft content.');
}
