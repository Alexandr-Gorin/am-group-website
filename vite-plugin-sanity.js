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

export function sanityHeroPlugin() {
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || 'b33hwgh0',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    useCdn: false,
    ...(process.env.SANITY_API_TOKEN && { token: process.env.SANITY_API_TOKEN }),
  })

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
