import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import { parse } from 'node-html-parser'

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function processSvg(svgText) {
  let s = svgText
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()
  // Inject class and aria-hidden onto the root <svg> element
  s = s.replace(/^<svg([^>]*)>/i, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s*class="[^"]*"/g, '')
      .replace(/\s*aria-hidden="[^"]*"/g, '')
    return `<svg${cleaned} class="products-section__card-icon" aria-hidden="true">`
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
              svgMarkup = processSvg(svgText)
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
