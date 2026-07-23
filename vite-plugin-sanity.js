import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import { parse } from 'node-html-parser'
import { toHTML } from '@portabletext/to-html'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { resolve } from 'path'

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Shared helper for all icon fields in this plugin.
// iconClass is injected onto the root <svg> element so CSS controls color.
// Hardcoded fill values are stripped so fill:currentColor (or whatever the
// CSS class provides) takes effect — fill="none" is kept for stroke-only icons.
function processSvg(svgText, iconClass) {
  let s = svgText
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+fill="(?!none")[^"]*"/g, '')
    .trim()
  s = s.replace(/^<svg([^>]*)>/i, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s*class="[^"]*"/g, '')
      .replace(/\s*aria-hidden="[^"]*"/g, '')
    return `<svg${cleaned} class="${iconClass}" aria-hidden="true">`
  })
  return s
}

const CHEVRON_SVG = `<svg class="button__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function renderTaskCard(card, svgMarkup) {
  return `<article class="products-section__card">
              <div class="products-section__card-head">
                <p class="products-section__card-title">${escapeHtml(card.title)}</p>
                ${svgMarkup}
              </div>
              <p class="products-section__card-body">${escapeHtml(card.description)}</p>
              <a
                href="/pages/catalog#${escapeHtml(card.filterKey)}"
                class="button button--ghost products-section__card-btn"
              >
                Подробнее
                ${CHEVRON_SVG}
              </a>
            </article>`
}

function makeSanityClient() {
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID || 'b33hwgh0',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    ...(process.env.SANITY_API_TOKEN && { token: process.env.SANITY_API_TOKEN }),
  })
}

export function sanityHeroPlugin() {
  const client = makeSanityClient()

  const builder = createImageUrlBuilder(client)

  return {
    name: 'sanity-hero',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      // Only process the homepage
      if (!ctx.filename.endsWith('index.html')) return html

      let hero
      try {
        hero = await client.fetch(`*[_type == "homeHero"][0]`)
      } catch (err) {
        console.warn('\n[sanity-hero] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-hero] Building with static fallback content.\n')
        return html
      }

      if (!hero) {
        console.warn('\n[sanity-hero] No homeHero document found in Sanity — building with static fallback content.\n')
        return html
      }

      const root = parse(html)

      if (hero.heading) {
        const el = root.querySelector('[data-sanity="heading"]')
        if (el) el.innerHTML = escapeHtml(hero.heading)
      }

      if (hero.subheading) {
        const el = root.querySelector('[data-sanity="subheading"]')
        if (el) el.innerHTML = escapeHtml(hero.subheading)
      }

      if (hero.buttonText) {
        const el = root.querySelector('[data-sanity="buttonText"]')
        if (el) el.innerHTML = escapeHtml(hero.buttonText)
      }

      if (hero.bannerImage) {
        const el = root.querySelector('[data-sanity="bannerImage"]')
        if (el) {
          const url = builder.image(hero.bannerImage).auto('format').width(1200).url()
          el.setAttribute('src', url)
        }
      }

      return root.toString()
    },
  }
}

export function sanityTaskCardsPlugin() {
  const client = makeSanityClient()

  return {
    name: 'sanity-task-cards',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('index.html')) return html

      let cards
      try {
        cards = await client.fetch(
          `*[_type == "taskCard"] | order(order asc) {
            title,
            description,
            filterKey,
            "iconUrl": icon.asset->url
          }`
        )
      } catch (err) {
        console.warn('\n[sanity-task-cards] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-task-cards] Building with static fallback content.\n')
        return html
      }

      if (!cards || cards.length < 6) {
        console.warn(
          `\n[sanity-task-cards] Expected 6 taskCard documents, got ${cards ? cards.length : 0} — building with static fallback content.\n`
        )
        return html
      }

      const cardHtmlParts = await Promise.all(
        cards.map(async (card) => {
          let svgMarkup = ''
          if (card.iconUrl) {
            try {
              const resp = await fetch(card.iconUrl)
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
              const svgText = await resp.text()
              svgMarkup = processSvg(svgText, 'products-section__card-icon')
            } catch (e) {
              console.warn(`\n[sanity-task-cards] Could not fetch icon for "${card.title}": ${e.message}\n`)
            }
          }
          return renderTaskCard(card, svgMarkup)
        })
      )

      const root = parse(html)
      const grid = root.querySelector('[data-sanity="solutionCardsGrid"]')
      if (!grid) {
        console.warn('\n[sanity-task-cards] Could not find [data-sanity="solutionCardsGrid"] in HTML — skipping.\n')
        return html
      }

      grid.innerHTML = '\n' + cardHtmlParts.join('\n') + '\n              '
      return root.toString()
    },
  }
}

export function sanityPartnershipPlugin() {
  const client = makeSanityClient()
  const builder = createImageUrlBuilder(client)

  return {
    name: 'sanity-partnership',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('index.html')) return html

      let section, cards
      try {
        ;[section, cards] = await Promise.all([
          client.fetch(`*[_type == "partnershipSection"][0]{ heading, subheading, buttonText }`),
          client.fetch(`*[_type == "partnerCard"] | order(order asc){ title, description, "imageRef": image }`),
        ])
      } catch (err) {
        console.warn('\n[sanity-partnership] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-partnership] Building with static fallback content.\n')
        return html
      }

      if (!section) {
        console.warn('\n[sanity-partnership] No partnershipSection document found — building with static fallback content.\n')
        return html
      }
      if (!cards || cards.length < 3) {
        console.warn(`\n[sanity-partnership] Expected 3 partnerCard documents, got ${cards ? cards.length : 0} — building with static fallback content.\n`)
        return html
      }

      const root = parse(html)

      if (section.heading) {
        const el = root.querySelector('[data-sanity="partnershipHeading"]')
        if (el) el.innerHTML = escapeHtml(section.heading)
      }

      if (section.subheading) {
        const el = root.querySelector('[data-sanity="partnershipSubheading"]')
        if (el) el.innerHTML = escapeHtml(section.subheading)
      }

      if (section.buttonText) {
        const el = root.querySelector('[data-sanity="partnershipButtonText"]')
        if (el) el.innerHTML = '\n                ' + escapeHtml(section.buttonText) + '\n              '
      }

      const grid = root.querySelector('[data-sanity="partnershipGrid"]')
      if (!grid) {
        console.warn('\n[sanity-partnership] Could not find [data-sanity="partnershipGrid"] in HTML — skipping.\n')
        return root.toString()
      }

      const cardHtml = cards.map((card) => {
        const imgUrl = card.imageRef
          ? builder.image(card.imageRef).auto('format').width(800).url()
          : ''
        const imgTag = imgUrl
          ? `<img src="${imgUrl}" alt="${escapeHtml(card.title)}" />`
          : ''
        return `<article class="partnership-section__card">
                  <div class="partnership-section__card-image partnership-section__card-image-wrapper">
                    ${imgTag}
                  </div>
                  <div class="partnership-section__card-content">
                    <p class="partnership-section__card-title">${escapeHtml(card.title)}</p>
                    <p class="partnership-section__card-body">${escapeHtml(card.description)}</p>
                  </div>
                </article>`
      }).join('\n')

      grid.innerHTML = '\n' + cardHtml + '\n              '
      return root.toString()
    },
  }
}

export function sanityStatsSectionPlugin() {
  const client = makeSanityClient()

  return {
    name: 'sanity-stats-section',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('index.html')) return html

      let section, cards
      try {
        ;[section, cards] = await Promise.all([
          client.fetch(`*[_type == "statsSection"][0]{ heading, subheading }`),
          client.fetch(`*[_type == "statCard"] | order(order asc){ value, description }`),
        ])
      } catch (err) {
        console.warn('\n[sanity-stats-section] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-stats-section] Building with static fallback content.\n')
        return html
      }

      if (!section) {
        console.warn('\n[sanity-stats-section] No statsSection document found — building with static fallback content.\n')
        return html
      }
      if (!cards || cards.length < 6) {
        console.warn(`\n[sanity-stats-section] Expected 6 statCard documents, got ${cards ? cards.length : 0} — building with static fallback content.\n`)
        return html
      }

      const root = parse(html)

      if (section.heading) {
        const el = root.querySelector('[data-sanity="statsHeading"]')
        if (el) el.innerHTML = escapeHtml(section.heading)
      }

      if (section.subheading) {
        const el = root.querySelector('[data-sanity="statsSubheading"]')
        if (el) el.innerHTML = escapeHtml(section.subheading)
      }

      const grid = root.querySelector('[data-sanity="statsGrid"]')
      if (!grid) {
        console.warn('\n[sanity-stats-section] Could not find [data-sanity="statsGrid"] in HTML — skipping.\n')
        return root.toString()
      }

      const cardHtml = cards.map((card) =>
        `<article class="effectiveness-section__card">
                <p class="effectiveness-section__card-title">${escapeHtml(card.value)}</p>
                <p class="effectiveness-section__card-body">${escapeHtml(card.description)}</p>
              </article>`
      ).join('\n')

      grid.innerHTML = '\n' + cardHtml + '\n              '
      return root.toString()
    },
  }
}

const faqPortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href = value?.href ?? '#'
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${children}</a>`
    },
  },
}

function renderFaqItem(item, index) {
  const id = `faq-${index + 1}`
  const answerHtml = toHTML(item.answer ?? [], { components: faqPortableTextComponents })
  return `<li class="faq-section__item">
                  <hr class="faq-section__divider" />
                  <button
                    class="faq-section__question"
                    aria-expanded="false"
                    aria-controls="${id}"
                  >
                    <span class="faq-section__question-text">${escapeHtml(item.question ?? '')}</span>
                    <span class="faq-section__icon" aria-hidden="true"></span>
                  </button>
                  <div id="${id}" class="faq-section__answer-wrapper">
                    <div class="faq-section__answer">
                      <div class="faq-section__answer-inner">
                        ${answerHtml}
                      </div>
                    </div>
                  </div>
                </li>`
}

export function sanityFaqPlugin() {
  const client = makeSanityClient()

  return {
    name: 'sanity-faq',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('index.html')) return html

      let section, items
      try {
        ;[section, items] = await Promise.all([
          client.fetch(`*[_type == "faqSection"][0]{ heading }`),
          client.fetch(`*[_type == "faqItem"] | order(order asc){ question, answer, order }`),
        ])
      } catch (err) {
        console.warn('\n[sanity-faq] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-faq] Building with static fallback content.\n')
        return html
      }

      if (!section) {
        console.warn('\n[sanity-faq] No faqSection document found — building with static fallback content.\n')
        return html
      }
      if (!items || items.length === 0) {
        console.warn('\n[sanity-faq] No faqItem documents found — building with static fallback content.\n')
        return html
      }

      const root = parse(html)

      if (section.heading) {
        const el = root.querySelector('[data-sanity="faqHeading"]')
        if (el) el.innerHTML = escapeHtml(section.heading)
      }

      const list = root.querySelector('[data-sanity="faqList"]')
      if (!list) {
        console.warn('\n[sanity-faq] Could not find [data-sanity="faqList"] in HTML — skipping.\n')
        return root.toString()
      }

      const itemsHtml = items.map((item, i) => renderFaqItem(item, i)).join('\n')
      list.innerHTML = '\n' + itemsHtml + '\n              '

      return root.toString()
    },
  }
}

const consentPortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href = value?.href ?? '#'
      return `<a href="${escapeHtml(href)}" class="form-consent__link">${children}</a>`
    },
  },
}

export function sanityContactSectionPlugin() {
  const client = makeSanityClient()
  const builder = createImageUrlBuilder(client)

  return {
    name: 'sanity-contact-section',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('index.html')) return html

      let section
      try {
        section = await client.fetch(
          `*[_type == "contactSection"][0]{
            heading,
            subheading,
            buttonText,
            consentText,
            newsletterText,
            backgroundImage
          }`
        )
      } catch (err) {
        console.warn('\n[sanity-contact-section] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-contact-section] Building with static fallback content.\n')
        return html
      }

      if (!section) {
        console.warn('\n[sanity-contact-section] No contactSection document found — building with static fallback content.\n')
        return html
      }

      const root = parse(html)

      if (section.heading) {
        const el = root.querySelector('[data-sanity="contactHeading"]')
        if (el) el.innerHTML = escapeHtml(section.heading)
      }

      if (section.subheading) {
        const el = root.querySelector('[data-sanity="contactSubheading"]')
        if (el) el.innerHTML = escapeHtml(section.subheading)
      }

      if (section.buttonText) {
        const el = root.querySelector('[data-sanity="contactButtonText"]')
        if (el) el.innerHTML = escapeHtml(section.buttonText)
      }

      if (section.newsletterText) {
        const el = root.querySelector('[data-sanity="contactNewsletterText"]')
        if (el) el.innerHTML = escapeHtml(section.newsletterText)
      }

      if (Array.isArray(section.consentText) && section.consentText.length > 0) {
        const el = root.querySelector('[data-sanity="contactConsentText"]')
        if (el) {
          // toHTML wraps each block in <p>; strip those since the target is already a <p>
          const rendered = toHTML(section.consentText, { components: consentPortableTextComponents })
            .replace(/<\/?p>/g, '')
          el.innerHTML = rendered
        }
      }

      if (section.backgroundImage) {
        const el = root.querySelector('[data-sanity="contactBgImage"]')
        if (el) {
          const url = builder.image(section.backgroundImage).auto('format').width(1920).url()
          el.setAttribute('src', url)
        }
      }

      return root.toString()
    },
  }
}

const materialsPortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href = value?.href ?? '#'
      return `<a href="${escapeHtml(href)}" class="useful-materials__link" target="_blank" rel="noopener noreferrer">${children}</a>`
    },
  },
}

function renderMaterialItem(item, index) {
  const id = `um-${index + 1}`
  const bodyHtml = toHTML(item.body ?? [], { components: materialsPortableTextComponents })
  return `<li class="useful-materials__item">
                  <hr class="useful-materials__divider" />
                  <button
                    class="useful-materials__question"
                    aria-expanded="false"
                    aria-controls="${id}"
                  >
                    <span class="useful-materials__question-text">${escapeHtml(item.title ?? '')}</span>
                    <span class="useful-materials__icon" aria-hidden="true"></span>
                  </button>
                  <div id="${id}" class="useful-materials__answer-wrapper">
                    <div class="useful-materials__answer">
                      <div class="useful-materials__answer-inner">
                        ${bodyHtml}
                      </div>
                    </div>
                  </div>
                </li>`
}

export function sanityMaterialsPlugin() {
  const client = makeSanityClient()

  return {
    name: 'sanity-materials',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('index.html')) return html

      let section, items
      try {
        ;[section, items] = await Promise.all([
          client.fetch(`*[_type == "materialsSection"][0]{ heading }`),
          client.fetch(`*[_type == "materialItem"] | order(order asc){ title, body, order }`),
        ])
      } catch (err) {
        console.warn('\n[sanity-materials] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-materials] Building with static fallback content.\n')
        return html
      }

      if (!section) {
        console.warn('\n[sanity-materials] No materialsSection document found — building with static fallback content.\n')
        return html
      }
      if (!items || items.length === 0) {
        console.warn('\n[sanity-materials] No materialItem documents found — building with static fallback content.\n')
        return html
      }

      const root = parse(html)

      if (section.heading) {
        const el = root.querySelector('[data-sanity="materialsHeading"]')
        if (el) el.innerHTML = escapeHtml(section.heading)
      }

      const list = root.querySelector('[data-sanity="materialsList"]')
      if (!list) {
        console.warn('\n[sanity-materials] Could not find [data-sanity="materialsList"] in HTML — skipping.\n')
        return root.toString()
      }

      const itemsHtml = items.map((item, i) => renderMaterialItem(item, i)).join('\n')
      list.innerHTML = '\n' + itemsHtml + '\n              '

      return root.toString()
    },
  }
}

// ─── News ────────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}

const newsBodyPortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href = value?.href ?? '#'
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${children}</a>`
    },
  },
}

function renderRelatedItem(article, builder) {
  const imgUrl = article.image
    ? builder.image(article.image).auto('format').width(400).url()
    : ''
  const dateStr = formatDate(article.date)
  const excerptHtml = article.excerpt
    ? `<p class="news-article__related-excerpt">${escapeHtml(article.excerpt)}</p>`
    : ''
  return `<a href="/pages/news-${article.pageNumber}" class="news-article__related-item">
                  <div class="news-article__related-image">
                    <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(article.title)}" />
                  </div>
                  <div class="news-article__related-desc">
                    <p class="news-article__related-name">${escapeHtml(article.title)}</p>
                    ${excerptHtml}
                    <p class="news-article__related-date">${dateStr}</p>
                  </div>
                </a>`
}

function injectCarousel(html, articles, builder) {
  const root = parse(html)
  const list = root.querySelector('[data-sanity="newsList"]')
  if (!list) {
    console.warn('\n[sanity-news] Could not find [data-sanity="newsList"] in HTML — skipping carousel.\n')
    return html
  }

  const itemsHtml = articles.map(article => {
    const imgUrl = article.image
      ? builder.image(article.image).auto('format').width(800).url()
      : ''
    const dateStr = formatDate(article.date)
    return `<li class="news-section__item">
                  <a class="news-section__item-row" href="/pages/news-${article.pageNumber}">
                    <div class="news-section__item-image">
                      <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(article.title)}" />
                    </div>
                    <div class="news-section__item-content">
                      <div class="news-section__item-description">
                        <p class="news-section__item-title">${escapeHtml(article.title)}</p>
                        <p class="news-section__item-excerpt">${escapeHtml(article.excerpt || '')}</p>
                      </div>
                      <p class="news-section__item-date">${dateStr}</p>
                    </div>
                  </a>
                </li>`
  }).join('\n')

  list.innerHTML = '\n' + itemsHtml + '\n              '
  return root.toString()
}

function injectArticlePage(html, article, allArticles, builder) {
  const root = parse(html)

  const titleStr = `Новости: ${article.title}. АМ ГРУПП - микробиологические решения для животноводства и растениеводства`

  const titleEl = root.querySelector('title')
  if (titleEl) titleEl.innerHTML = escapeHtml(titleStr)

  const metaDesc = root.querySelector('meta[name="description"]')
  if (metaDesc) metaDesc.setAttribute('content', article.excerpt || article.title || '')

  const ogTitle = root.querySelector('meta[property="og:title"]')
  if (ogTitle) ogTitle.setAttribute('content', titleStr)

  const ogUrl = root.querySelector('meta[property="og:url"]')
  if (ogUrl) ogUrl.setAttribute('content', `https://microbio.pro/pages/news-${article.pageNumber}`)

  if (article.image) {
    const heroImg = root.querySelector('.news-article-hero__image')
    if (heroImg) {
      heroImg.setAttribute('src', builder.image(article.image).auto('format').width(1920).url())
    }
  }

  const h1 = root.querySelector('.news-article__title')
  if (h1) h1.innerHTML = escapeHtml(article.title)

  const dateEls = root.querySelectorAll('.news-article__meta-item')
  if (dateEls && dateEls[0]) dateEls[0].innerHTML = formatDate(article.date)

  const bodyEl = root.querySelector('.news-article__body')
  if (bodyEl && Array.isArray(article.body) && article.body.length > 0) {
    bodyEl.innerHTML = toHTML(article.body, { components: newsBodyPortableTextComponents })
  }

  const relatedEl = root.querySelector('.news-article__related-list')
  if (relatedEl) {
    const related = allArticles
      .filter(a => a.pageNumber !== article.pageNumber)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 3)
    relatedEl.innerHTML = '\n' + related.map(a => renderRelatedItem(a, builder)).join('\n') + '\n                '
  }

  return root.toString()
}

export async function prepareNewsPages(projectRoot) {
  const pagesDir = resolve(projectRoot, 'src/pages')
  const templatePath = resolve(pagesDir, 'news-template.html')

  const client = makeSanityClient()
  let articles
  try {
    articles = await client.fetch(
      `*[_type == "newsArticle" && defined(pageNumber)] { pageNumber }`
    )
  } catch (err) {
    console.warn('\n[sanity-news] Failed to query Sanity for news pages:', err.message)
    console.warn('[sanity-news] Will use existing news-*.html files only.\n')
    articles = []
  }

  if (articles && articles.length > 0 && existsSync(templatePath)) {
    const template = readFileSync(templatePath, 'utf-8')
    for (const { pageNumber } of articles) {
      if (!pageNumber) continue
      const dest = resolve(pagesDir, `news-${pageNumber}.html`)
      if (!existsSync(dest)) {
        writeFileSync(dest, template, 'utf-8')
        console.log(`[sanity-news] Generated news-${pageNumber}.html from template`)
      }
    }
  }

  const newsInputs = {}
  for (const f of readdirSync(pagesDir)) {
    const m = f.match(/^news-(\d+)\.html$/)
    if (m) newsInputs[`news-${m[1]}`] = resolve(pagesDir, f)
  }
  return newsInputs
}

export function sanityNewsPlugin() {
  const client = makeSanityClient()
  const builder = createImageUrlBuilder(client)
  let articlesCache = null

  async function getArticles() {
    if (!articlesCache) {
      articlesCache = await client.fetch(
        `*[_type == "newsArticle" && defined(pageNumber)] | order(date desc) {
          title, excerpt, date, pageNumber, image, body
        }`
      )
    }
    return articlesCache
  }

  return {
    name: 'sanity-news',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      // Homepage carousel
      if (ctx.filename.endsWith('index.html')) {
        let articles
        try {
          articles = await getArticles()
        } catch (err) {
          console.warn('\n[sanity-news] Failed to fetch Sanity data:', err.message)
          console.warn('[sanity-news] Building homepage news carousel with static fallback.\n')
          return html
        }
        if (!articles || articles.length === 0) {
          console.warn('\n[sanity-news] No newsArticle documents found — building homepage with static fallback.\n')
          return html
        }
        try {
          return injectCarousel(html, articles, builder)
        } catch (err) {
          console.warn('\n[sanity-news] Error injecting carousel:', err.message, '— building with static fallback.\n')
          return html
        }
      }

      // Individual article pages
      const newsMatch = ctx.filename.match(/[/\\]news-(\d+)\.html$/)
      if (newsMatch) {
        const pageNumber = parseInt(newsMatch[1], 10)
        let allArticles
        try {
          allArticles = await getArticles()
        } catch (err) {
          console.warn(`\n[sanity-news] Failed to fetch Sanity data for news-${pageNumber}.html:`, err.message)
          console.warn('[sanity-news] Building with static fallback.\n')
          return html
        }
        const article = allArticles ? allArticles.find(a => a.pageNumber === pageNumber) : null
        if (!article) {
          console.warn(`\n[sanity-news] No Sanity article with pageNumber=${pageNumber} — building with static fallback.\n`)
          return html
        }
        try {
          return injectArticlePage(html, article, allArticles, builder)
        } catch (err) {
          console.warn(`\n[sanity-news] Error injecting content into news-${pageNumber}.html:`, err.message, '— building with static fallback.\n')
          return html
        }
      }

      return html
    },
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

const PANEL_ARROW_SVG = `<svg class="button__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18.4141 13.0001L13.7071 8.29309C13.6142 8.20025 13.504 8.1266 13.3827 8.07635C13.2614 8.02611 13.1314 8.00024 13.0001 8.00024C12.8688 8.00024 12.7387 8.02611 12.6174 8.07635C12.4961 8.1266 12.3859 8.20025 12.2931 8.29309C12.2002 8.38594 12.1266 8.49616 12.0763 8.61747C12.0261 8.73878 12.0002 8.86879 12.0002 9.00009C12.0002 9.1314 12.0261 9.26141 12.0763 9.38272C12.1266 9.50403 12.2002 9.61425 12.2931 9.70709L14.5861 12.0001H7.00006C6.73485 12.0001 6.48049 12.1055 6.29296 12.293C6.10542 12.4805 6.00006 12.7349 6.00006 13.0001C6.00006 13.2653 6.10542 13.5197 6.29296 13.7072C6.48049 13.8947 6.73485 14.0001 7.00006 14.0001H14.5861L12.2931 16.2931C12.1999 16.3857 12.1259 16.4959 12.0755 16.6172C12.025 16.7386 11.999 16.8687 11.999 17.0001C11.999 17.1315 12.025 17.2616 12.0755 17.3829C12.1259 17.5043 12.1999 17.6144 12.2931 17.7071C12.4806 17.8946 12.7349 17.9999 13.0001 17.9999C13.2652 17.9999 13.5195 17.8946 13.7071 17.7071L18.4141 13.0001Z" fill="currentColor"/></svg>`

function normalizeFilterTags(filterTags) {
  return (filterTags || []).flatMap(t => t.split(',').map(s => s.trim())).filter(Boolean)
}

function renderPanelCard(category, svgMarkup) {
  const key = escapeHtml(category.filterKey)
  const title = escapeHtml(category.title)
  return `<a href="#${key}" data-filter="${key}" class="panel-card">
          <p class="panel-card__title">${title}</p>
          <div class="panel-card__icon">
            ${svgMarkup}
          </div>
          <button class="button button--ghost" tabindex="-1">
            Подробнее
            ${PANEL_ARROW_SVG}
          </button>
        </a>`
}

function renderCatalogCard(product, imageUrl) {
  const tags = normalizeFilterTags(product.filterTags)
  const dataCategory = escapeHtml(tags.join(' '))
  const slug = escapeHtml(product.slug)
  const title = escapeHtml(product.title)
  const desc = escapeHtml(product.shortDescription || '')
  const buttonType = product.buttonType === 'secondary' ? 'secondary' : 'primary'
  const imgTag = imageUrl
    ? `<img class="card__image" src="${escapeHtml(imageUrl)}" alt="${title}" />`
    : ''
  return `<article class="card" data-category="${dataCategory}">
                <div class="card__image-wrapper">
                  ${imgTag}
                </div>
                <div class="card__content">
                  <h3 class="card__title">${title}</h3>
                  <p class="card__description">${desc}</p>
                </div>
                <a href="product-${slug}" class="button button--${buttonType}">Подробнее</a>
              </article>`
}

const productBodyPortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href = value?.href ?? '#'
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${children}</a>`
    },
  },
}

function renderProductAccordionItem(title, bodyHtml) {
  return `<div class="accordion__item">
                    <button class="accordion__header" aria-expanded="false">
                      <span class="accordion__title">${escapeHtml(title)}</span>
                      <span class="accordion__icon" aria-hidden="true"></span>
                    </button>
                    <div class="accordion__body">
                      <div class="accordion__content">
                        ${bodyHtml}
                      </div>
                    </div>
                  </div>`
}

function injectProductPage(html, product, builder) {
  const root = parse(html)

  const pageTitle = product.pageTitle || product.title || ''
  const titleStr = `${pageTitle}. АМ ГРУПП - микробиологические решения для животноводства и растениеводства`

  const titleEl = root.querySelector('title')
  if (titleEl) titleEl.innerHTML = escapeHtml(titleStr)

  const metaDesc = root.querySelector('meta[name="description"]')
  if (metaDesc && product.shortDescription) metaDesc.setAttribute('content', product.shortDescription)

  const ogTitle = root.querySelector('meta[property="og:title"]')
  if (ogTitle) ogTitle.setAttribute('content', titleStr)

  const ogUrl = root.querySelector('meta[property="og:url"]')
  if (ogUrl) ogUrl.setAttribute('content', `https://microbio.pro/pages/product-${product.slug}`)

  const h1 = root.querySelector('.product-card__title')
  if (h1) h1.innerHTML = escapeHtml(pageTitle)

  if (product.mainImage) {
    try {
      const imgUrl = builder.image(product.mainImage).auto('format').width(800).url()
      const heroImg = root.querySelector('.product-card__image')
      if (heroImg) {
        heroImg.setAttribute('src', escapeHtml(imgUrl))
        heroImg.setAttribute('alt', escapeHtml(pageTitle))
      }
    } catch (e) {
      console.warn(`\n[sanity-product-page] Could not build image URL for "${product.slug}": ${e.message}\n`)
    }
  }

  const accordion = root.querySelector('.accordion')
  if (accordion) {
    const items = []
    if (product.descriptionTitle || product.descriptionBody) {
      const descTitle = product.descriptionTitle || pageTitle
      const descBody = product.descriptionBody
        ? `<p>${product.descriptionBody.split('\n').map(escapeHtml).join('</p><p>')}</p>`
        : ''
      items.push(renderProductAccordionItem(descTitle, descBody))
    }
    if (product.purpose && product.purpose.length > 0) {
      items.push(renderProductAccordionItem('Назначение', toHTML(product.purpose, { components: productBodyPortableTextComponents })))
    }
    if (product.composition && product.composition.length > 0) {
      items.push(renderProductAccordionItem('Состав', toHTML(product.composition, { components: productBodyPortableTextComponents })))
    }
    if (product.application && product.application.length > 0) {
      items.push(renderProductAccordionItem('Применение', toHTML(product.application, { components: productBodyPortableTextComponents })))
    }
    if (items.length > 0) {
      accordion.innerHTML = '\n' + items.join('\n') + '\n                '
    }
  }

  const subjectInput = root.querySelector('input[name="_subject"]')
  if (subjectInput) subjectInput.setAttribute('value', `Заявка: ${pageTitle}`)

  const productNameInput = root.querySelector('input[name="product_name"]')
  if (productNameInput) productNameInput.setAttribute('value', pageTitle)

  const backBtn = root.querySelector('[data-sanity="backBtn"]')
  if (backBtn && product.categoryFilterKey) {
    backBtn.setAttribute('href', `/pages/catalog#${product.categoryFilterKey}`)
    backBtn.removeAttribute('data-sanity')
  }

  // Certificates
  const certEl = root.querySelector('[data-sanity="certificates"]')
  if (certEl) {
    if (product.certificates && product.certificates.length > 0) {
      certEl.setAttribute('class', 'product-card__awards')
      certEl.removeAttribute('data-sanity')
      certEl.innerHTML = product.certificates.map((img) => {
        const url = builder.image(img).auto('format').width(400).url()
        return `<div class="awards__card"><img class="awards__card-img product-card__award-img" data-lightbox-group="certificates" src="${escapeHtml(url)}" alt="Сертификат" /></div>`
      }).join('\n')
    } else {
      certEl.remove()
    }
  }

  // ResearchResults
  const researchEl = root.querySelector('[data-sanity="researchResults"]')
  if (researchEl) {
    if (product.researchResults && product.researchResults.length > 0) {
      researchEl.setAttribute('class', 'product-card__awards')
      researchEl.removeAttribute('data-sanity')
      researchEl.innerHTML = product.researchResults.map((img) => {
        const url = builder.image(img).auto('format').width(800).url()
        return `<div class="awards__card"><img class="awards__card-img product-card__award-img" data-lightbox-group="research-results" src="${escapeHtml(url)}" alt="Результаты исследований" /></div>`
      }).join('\n')
    } else {
      researchEl.remove()
    }
  }

  return root.toString()
}

export async function prepareProductPages(projectRoot) {
  const pagesDir = resolve(projectRoot, 'src/pages')
  const templatePath = resolve(pagesDir, 'product-template.html')

  if (!existsSync(templatePath)) {
    console.warn('\n[sanity-products] product-template.html not found — skipping auto-generation.\n')
  } else {
    const client = makeSanityClient()
    let slugs
    try {
      slugs = await client.fetch(`*[_type == "product" && defined(slug.current)] { "slug": slug.current }`)
    } catch (err) {
      console.warn('\n[sanity-products] Failed to query Sanity for product slugs:', err.message)
      slugs = []
    }
    if (slugs && slugs.length > 0) {
      const template = readFileSync(templatePath, 'utf-8')
      for (const { slug } of slugs) {
        if (!slug) continue
        const dest = resolve(pagesDir, `product-${slug}.html`)
        if (!existsSync(dest)) {
          writeFileSync(dest, template, 'utf-8')
          console.log(`[sanity-products] Generated product-${slug}.html from template`)
        }
      }
    }
  }

  const productInputs = {}
  for (const f of readdirSync(pagesDir)) {
    const m = f.match(/^product-(.+)\.html$/)
    if (m && m[1] !== 'template') productInputs[`product-${m[1]}`] = resolve(pagesDir, f)
  }
  return productInputs
}

export function sanityProductsPlugin() {
  const client = makeSanityClient()
  const builder = createImageUrlBuilder(client)

  return {
    name: 'sanity-products',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('catalog.html')) return html

      let categories, products
      try {
        ;[categories, products] = await Promise.all([
          client.fetch(`*[_type == "category"] | order(order asc) {
            title, filterKey, "iconUrl": icon.asset->url
          }`),
          client.fetch(`*[_type == "product"] | order(category->order asc, title asc) {
            title, "slug": slug.current, filterTags, shortDescription, buttonType,
            "mainImage": mainImage[0]
          }`)
        ])
      } catch (err) {
        console.warn('\n[sanity-products] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-products] Building with static fallback content.\n')
        return html
      }

      if (!categories || categories.length === 0) {
        console.warn('\n[sanity-products] No category documents found — building with static fallback.\n')
        return html
      }
      if (!products || products.length === 0) {
        console.warn('\n[sanity-products] No product documents found — building with static fallback.\n')
        return html
      }

      const panelHtmlParts = await Promise.all(
        categories.map(async (cat) => {
          let svgMarkup = ''
          if (cat.iconUrl) {
            try {
              const resp = await fetch(cat.iconUrl)
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
              svgMarkup = processSvg(await resp.text(), 'panel-card__icon-svg')
            } catch (e) {
              console.warn(`\n[sanity-products] Could not fetch icon for "${cat.title}": ${e.message}\n`)
            }
          }
          return renderPanelCard(cat, svgMarkup)
        })
      )

      const cardHtmlParts = await Promise.all(
        products.map(async (product) => {
          let imageUrl = ''
          if (product.mainImage) {
            try {
              imageUrl = builder.image(product.mainImage).auto('format').width(600).url()
            } catch (e) {
              console.warn(`\n[sanity-products] Could not build image URL for "${product.title}": ${e.message}\n`)
            }
          }
          return renderCatalogCard(product, imageUrl)
        })
      )

      const root = parse(html)

      const panelCardsEl = root.querySelector('[data-sanity="catalogPanelCards"]')
      if (!panelCardsEl) {
        console.warn('\n[sanity-products] Could not find [data-sanity="catalogPanelCards"] — skipping panel cards.\n')
      } else {
        panelCardsEl.innerHTML = '\n' + panelHtmlParts.join('\n') + '\n      '
      }

      const gridEl = root.querySelector('[data-sanity="catalogGrid"]')
      if (!gridEl) {
        console.warn('\n[sanity-products] Could not find [data-sanity="catalogGrid"] — skipping product grid.\n')
      } else {
        gridEl.innerHTML = '\n' + cardHtmlParts.join('\n') + '\n              '
      }

      return root.toString()
    },
  }
}

export function sanityProductPagePlugin() {
  const client = makeSanityClient()
  const builder = createImageUrlBuilder(client)
  let productsCache = null

  async function getProducts() {
    if (!productsCache) {
      productsCache = await client.fetch(
        `*[_type == "product" && defined(slug.current)] {
          title, pageTitle, shortDescription, "slug": slug.current,
          "categoryFilterKey": category->filterKey,
          "mainImage": mainImage[0],
          descriptionTitle, descriptionBody,
          purpose, composition, application,
          certificates, researchResults
        }`
      )
    }
    return productsCache
  }

  return {
    name: 'sanity-product-page',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      const productMatch = ctx.filename.match(/[/\\]product-(.+)\.html$/)
      if (!productMatch) return html

      const slug = productMatch[1]
      let allProducts
      try {
        allProducts = await getProducts()
      } catch (err) {
        console.warn(`\n[sanity-product-page] Failed to fetch data for product-${slug}.html:`, err.message)
        console.warn('[sanity-product-page] Building with static fallback.\n')
        return html
      }

      const product = allProducts ? allProducts.find(p => p.slug === slug) : null
      if (!product) {
        console.warn(`\n[sanity-product-page] No product with slug="${slug}" found — building with static fallback.\n`)
        return html
      }

      try {
        return injectProductPage(html, product, builder)
      } catch (err) {
        console.warn(`\n[sanity-product-page] Error injecting content into product-${slug}.html:`, err.message, '— building with static fallback.\n')
        return html
      }
    },
  }
}

// ─── Service Cards (services.html) ───────────────────────────────────────────

export function sanityServiceCardsPlugin() {
  const client = makeSanityClient()

  return {
    name: 'sanity-service-cards',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('services.html')) return html

      let cards
      try {
        cards = await client.fetch(
          `*[_type == "servicePageCard"]{title, description, buttonText, targetService->{slug}}`
        )
      } catch (err) {
        console.warn('\n[sanity-service-cards] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-service-cards] Building with static fallback content.\n')
        return html
      }

      if (!cards?.length) {
        console.warn('\n[sanity-service-cards] No servicePageCard documents found — building with static fallback content.\n')
        return html
      }

      const root = parse(html)

      for (const card of cards) {
        const slug = card.targetService?.slug?.current
        if (!slug) continue
        const cardEl = root.querySelector(`[data-sanity="serviceCard-${slug}"]`)
        if (!cardEl) continue

        const titleEl = cardEl.querySelector('.services-card__title')
        if (titleEl && card.title) titleEl.innerHTML = escapeHtml(card.title)

        const descEls = cardEl.querySelectorAll('.services-card__description')
        if (descEls.length && card.description) {
          descEls[0].innerHTML = escapeHtml(card.description)
          for (let i = 1; i < descEls.length; i++) descEls[i].remove()
        }

        const btnEl = cardEl.querySelector('.services-card__btn')
        if (btnEl && card.buttonText) btnEl.innerHTML = escapeHtml(card.buttonText)
      }

      return root.toString()
    },
  }
}

// ─── Individual Service Pages ─────────────────────────────────────────────────

const SERVICE_PAGE_MAP = {
  audit: { file: 'services-audit.html', prefix: 'audit' },
  soprovozhdenie: { file: 'services-support.html', prefix: 'support' },
  obuchenie: { file: 'services-training.html', prefix: 'training' },
}

// Selectors for elements that live INSIDE [data-sanity="serviceDescriptionBody"]
// but belong to separate Sanity fields — save before replacing innerHTML.
const SERVICE_PRESERVE_SELECTORS = {
  audit: [],
  support: ['.products-section__cta'],
  training: ['.training-content__showcase'],
}

function makeServiceBodyComponents(prefix) {
  return {
    block: {
      h3: ({ children }) => `<p class="${prefix}-content__block-title">${children}</p>`,
      h4: ({ children }) => `<p class="${prefix}-content__block-title">${children}</p>`,
      normal: ({ children }) => `<p>${children}</p>`,
    },
    list: {
      bullet: ({ children }) => `<ul>${children}</ul>`,
    },
  }
}

export function sanityServicePagePlugin() {
  const client = makeSanityClient()
  const builder = createImageUrlBuilder(client)
  let servicesPromise = null

  return {
    name: 'sanity-service-page',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      const entry = Object.entries(SERVICE_PAGE_MAP).find(([, info]) => ctx.filename.endsWith(info.file))
      if (!entry) return html
      const [slug, { prefix }] = entry

      if (!servicesPromise) {
        servicesPromise = client.fetch(
          `*[_type == "service"]{title, slug, heroImage, heroAlt, descriptionTitle, descriptionBody, programImage, programImageAlt, programTitle, programDescription, ctaButtonText}`
        )
      }

      let allServices
      try {
        allServices = await servicesPromise
      } catch (err) {
        servicesPromise = null
        console.warn(`\n[sanity-service-page] Failed to fetch Sanity data:`, err.message)
        console.warn('[sanity-service-page] Building with static fallback content.\n')
        return html
      }

      const service = allServices?.find(s => s.slug?.current === slug)
      if (!service) {
        console.warn(`\n[sanity-service-page] No service with slug="${slug}" found — building with static fallback.\n`)
        return html
      }

      const root = parse(html)

      if (service.heroImage) {
        const el = root.querySelector('[data-sanity="serviceHeroImage"]')
        if (el) {
          el.setAttribute('src', builder.image(service.heroImage).auto('format').width(1920).url())
          if (service.heroAlt) el.setAttribute('alt', escapeHtml(service.heroAlt))
        }
      }

      if (service.descriptionTitle) {
        const el = root.querySelector('[data-sanity="serviceTitle"]')
        if (el) el.innerHTML = escapeHtml(service.descriptionTitle)
      }

      if (service.descriptionBody) {
        const el = root.querySelector('[data-sanity="serviceDescriptionBody"]')
        if (el) {
          const components = makeServiceBodyComponents(prefix)
          const bodyHtml = toHTML(service.descriptionBody, { components })
          const preserveSelectors = SERVICE_PRESERVE_SELECTORS[prefix] || []
          const preserved = preserveSelectors
            .map(sel => el.querySelector(sel))
            .filter(Boolean)
            .map(n => n.outerHTML)
          el.innerHTML = bodyHtml + preserved.join('')
        }
      }

      if (service.programImage) {
        const el = root.querySelector('[data-sanity="serviceProgramImage"]')
        if (el) {
          el.setAttribute('src', builder.image(service.programImage).auto('format').width(800).url())
          if (service.programImageAlt) el.setAttribute('alt', escapeHtml(service.programImageAlt))
        }
      }

      if (service.programTitle) {
        const el = root.querySelector('[data-sanity="serviceProgramTitle"]')
        if (el) el.innerHTML = escapeHtml(service.programTitle)
      }

      if (service.programDescription) {
        const el = root.querySelector('[data-sanity="serviceProgramDescription"]')
        if (el) el.innerHTML = escapeHtml(service.programDescription)
      }

      if (service.ctaButtonText) {
        const el = root.querySelector('[data-sanity="serviceCtaBtn"]')
        if (el) el.innerHTML = escapeHtml(service.ctaButtonText)
      }

      return root.toString()
    },
  }
}

export function sanityServicesHeroPlugin() {
  const client = makeSanityClient()
  const builder = createImageUrlBuilder(client)

  return {
    name: 'sanity-services-hero',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('services.html')) return html

      let hero
      try {
        hero = await client.fetch(`*[_type == "servicesHero"][0]`)
      } catch (err) {
        console.warn('\n[sanity-services-hero] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-services-hero] Building with static fallback content.\n')
        return html
      }

      if (!hero) {
        console.warn('\n[sanity-services-hero] No servicesHero document found in Sanity — building with static fallback content.\n')
        return html
      }

      const root = parse(html)

      if (hero.heading) {
        const el = root.querySelector('[data-sanity="servicesHeroHeading"]')
        if (el) el.innerHTML = escapeHtml(hero.heading)
      }

      if (hero.subheading) {
        const el = root.querySelector('[data-sanity="servicesHeroSubheading"]')
        if (el) el.innerHTML = escapeHtml(hero.subheading)
      }

      if (hero.image) {
        const el = root.querySelector('[data-sanity="servicesHeroImage"]')
        if (el) {
          const url = builder.image(hero.image).auto('format').width(1200).url()
          el.setAttribute('src', url)
          el.setAttribute('alt', escapeHtml(hero.heading || ''))
        }
      }

      return root.toString()
    },
  }
}

// ─── About Company Hero ───────────────────────────────────────────────────────

const aboutHeroBodyComponents = {
  block: {
    normal: ({ children }) => `<p>${children}</p>`,
  },
  list: {
    bullet: ({ children }) => `<ul class="about-overview__list">${children}</ul>`,
  },
}

export function sanityAboutHeroPlugin() {
  const client = makeSanityClient()

  return {
    name: 'sanity-about-hero',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('about-company.html')) return html

      let hero
      try {
        hero = await client.fetch(`*[_type == "aboutHero"][0]`)
      } catch (err) {
        console.warn('\n[sanity-about-hero] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-about-hero] Building with static fallback content.\n')
        return html
      }

      if (!hero) {
        console.warn('\n[sanity-about-hero] No aboutHero document found in Sanity — building with static fallback content.\n')
        return html
      }

      const root = parse(html)

      if (hero.eyebrow) {
        const el = root.querySelector('[data-sanity="aboutEyebrow"]')
        if (el) el.innerHTML = escapeHtml(hero.eyebrow)
      }

      if (hero.heading) {
        const el = root.querySelector('[data-sanity="aboutHeading"]')
        if (el) el.innerHTML = escapeHtml(hero.heading)
      }

      if (hero.description) {
        const el = root.querySelector('[data-sanity="aboutDescription"]')
        if (el) el.innerHTML = toHTML(hero.description, { components: aboutHeroBodyComponents })
      }

      return root.toString()
    },
  }
}

// ─── About Company Awards grid ────────────────────────────────────────────────

export function sanityAboutAwardsPlugin() {
  const client = makeSanityClient()
  const builder = createImageUrlBuilder(client)

  return {
    name: 'sanity-about-awards',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('about-company.html')) return html

      let awards
      try {
        awards = await client.fetch(
          `*[_type == "awardCard"] | order(order asc) { image, imageAlt }`
        )
      } catch (err) {
        console.warn('\n[sanity-about-awards] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-about-awards] Building with static fallback content.\n')
        return html
      }

      if (!awards?.length) {
        console.warn('\n[sanity-about-awards] No awardCard documents found — building with static fallback content.\n')
        return html
      }

      const root = parse(html)
      const grid = root.querySelector('[data-sanity="awardsGrid"]')
      if (!grid) return root.toString()

      grid.innerHTML = awards.map(award => {
        const src = award.image
          ? builder.image(award.image).auto('format').width(300).url()
          : ''
        const alt = escapeHtml(award.imageAlt || '')
        return `<div class="awards__card"><img class="awards__card-img" src="${src}" alt="${alt}" /></div>`
      }).join('\n              ')

      console.log(`[sanity-about-awards] Injected ${awards.length} award cards.`)
      return root.toString()
    },
  }
}

export function sanityAboutAdvantagesPlugin() {
  const client = makeSanityClient()

  return {
    name: 'sanity-about-advantages',
    apply: 'build',
    enforce: 'pre',

    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('about-company.html')) return html

      let section, cards
      try {
        ;[section, cards] = await Promise.all([
          client.fetch(`*[_type == "aboutAdvantagesSection"][0]{ heading, subheading }`),
          client.fetch(`*[_type == "advantageCard"] | order(order asc) { title, subtitle, description, "iconUrl": icon.asset->url }`),
        ])
      } catch (err) {
        console.warn('\n[sanity-about-advantages] Failed to fetch Sanity data:', err.message)
        console.warn('[sanity-about-advantages] Building with static fallback content.\n')
        return html
      }

      const root = parse(html)

      if (section) {
        const titleEl = root.querySelector('[data-sanity="advantagesSectionHeading"]')
        const subtitleEl = root.querySelector('[data-sanity="advantagesSectionSubheading"]')
        if (titleEl && section.heading) titleEl.set_content(escapeHtml(section.heading))
        if (subtitleEl && section.subheading) subtitleEl.set_content(escapeHtml(section.subheading))
      }

      if (!cards?.length) {
        console.warn('\n[sanity-about-advantages] No advantageCard documents found — skipping grid.\n')
        return root.toString()
      }

      const cardHtmlParts = await Promise.all(
        cards.map(async (card) => {
          let svgMarkup = ''
          if (card.iconUrl) {
            try {
              const resp = await fetch(card.iconUrl)
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
              svgMarkup = processSvg(await resp.text(), 'why-us__card-icon-svg')
            } catch (e) {
              console.warn(`\n[sanity-about-advantages] Could not fetch icon for "${card.title}": ${e.message}\n`)
            }
          }
          return `<div class="why-us__card">
                <div class="why-us__card-header">
                  <h3 class="why-us__card-title">${escapeHtml(card.title || '')}</h3>
                  <span class="why-us__card-icon" aria-hidden="true">
                    ${svgMarkup}
                  </span>
                </div>
                <div class="why-us__card-body">
                  <p class="why-us__card-label">${escapeHtml(card.subtitle || '')}</p>
                  <p class="why-us__card-text">${escapeHtml(card.description || '')}</p>
                </div>
              </div>`
        })
      )

      const grid = root.querySelector('[data-sanity="advantagesGrid"]')
      if (!grid) {
        console.warn('\n[sanity-about-advantages] Could not find [data-sanity="advantagesGrid"] — skipping.\n')
        return root.toString()
      }

      grid.innerHTML = '\n              ' + cardHtmlParts.join('\n\n              ') + '\n            '

      console.log(`[sanity-about-advantages] Injected ${cards.length} advantage cards.`)
      return root.toString()
    },
  }
}
