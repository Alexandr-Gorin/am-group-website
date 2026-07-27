// Preview mode for Sanity Studio's Presentation tool.
// Activates ONLY when ?preview=amg-preview-2026 is present in the URL.
// Draft data is fetched through /api/preview-data (server-side proxy) — no Sanity
// token ever lands in the client bundle.
//
// Sections patched on the homepage:
//   homeHero         — heading, subheading, buttonText, bannerImage
//   partnershipSection — heading, subheading, buttonText
//   faqSection       — heading + all FAQ items (with portable text answers)
//   contactSection   — heading, subheading, buttonText, newsletterText, bgImage, consentText

const PREVIEW_SECRET = 'amg-preview-2026';

const isHomepage =
  window.location.pathname === '/' || window.location.pathname === '/index.html';
const isPreview =
  new URLSearchParams(window.location.search).get('preview') === PREVIEW_SECRET;

if (isPreview && isHomepage) {
  activatePreview().catch((err) => console.error('[preview-mode]', err));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function setHtml(attr, html) {
  const el = document.querySelector(`[data-sanity="${attr}"]`);
  if (el && html != null) el.innerHTML = html;
}

function setSrc(attr, url) {
  const el = document.querySelector(`[data-sanity="${attr}"]`);
  if (el && url) el.setAttribute('src', url);
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

// ─── Main ────────────────────────────────────────────────────────────────────

async function activatePreview() {
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

  console.log('[preview-mode] Done — DOM patched with draft content.');
}
