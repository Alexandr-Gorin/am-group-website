import { resolve } from 'path'
import { defineConfig } from 'vite'
import { sanityHeroPlugin, sanityTaskCardsPlugin, sanityStatsSectionPlugin, sanityPartnershipPlugin, sanityFaqPlugin, sanityContactSectionPlugin, sanityMaterialsPlugin, sanityNewsPlugin, prepareNewsPages } from './vite-plugin-sanity.js'

export default defineConfig(async () => {
  const newsInputs = await prepareNewsPages(__dirname)

  return {
    plugins: [sanityHeroPlugin(), sanityTaskCardsPlugin(), sanityStatsSectionPlugin(), sanityPartnershipPlugin(), sanityFaqPlugin(), sanityContactSectionPlugin(), sanityMaterialsPlugin(), sanityNewsPlugin()],
    server: {
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          catalog: resolve(__dirname, 'src/pages/catalog.html'),
          contacts: resolve(__dirname, 'src/pages/contacts.html'),
          services: resolve(__dirname, 'src/pages/services.html'),
          'about-company': resolve(__dirname, 'src/pages/about-company.html'),
          feedback: resolve(__dirname, 'src/pages/feedback.html'),
          cookie: resolve(__dirname, 'src/pages/cookie.html'),
          error: resolve(__dirname, 'src/pages/error.html'),
          policy: resolve(__dirname, 'src/pages/policy.html'),
          'services-audit': resolve(__dirname, 'src/pages/services-audit.html'),
          'services-support': resolve(__dirname, 'src/pages/services-support.html'),
          'services-training': resolve(__dirname, 'src/pages/services-training.html'),
          'product-decoman': resolve(__dirname, 'src/pages/product-decoman.html'),
          'product-decoman-plus': resolve(__dirname, 'src/pages/product-decoman-plus.html'),
          'product-agromik': resolve(__dirname, 'src/pages/product-agromik.html'),
          'product-antoyl': resolve(__dirname, 'src/pages/product-antoyl.html'),
          'product-bioproductin': resolve(__dirname, 'src/pages/product-bioproductin.html'),
          'product-gordeback': resolve(__dirname, 'src/pages/product-gordeback.html'),
          'product-polibact': resolve(__dirname, 'src/pages/product-polibact.html'),
          'product-rizofos-clever': resolve(__dirname, 'src/pages/product-rizofos-clever.html'),
          'product-rizofos-lucern': resolve(__dirname, 'src/pages/product-rizofos-lucern.html'),
          'product-rumibact': resolve(__dirname, 'src/pages/product-rumibact.html'),
          'product-silo-rye': resolve(__dirname, 'src/pages/product-silo-rye.html'),
          'product-silo-twice': resolve(__dirname, 'src/pages/product-silo-twice.html'),
          'product-soyariz': resolve(__dirname, 'src/pages/product-soyariz.html'),
          ...newsInputs,
        },
      },
    },
  }
})
