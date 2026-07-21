import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import { parse } from 'node-html-parser'
import { toHTML } from '@portabletext/to-html'

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
