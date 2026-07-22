import { resolve } from 'path'
import { defineConfig } from 'vite'
import { sanityHeroPlugin, sanityTaskCardsPlugin, sanityStatsSectionPlugin, sanityPartnershipPlugin, sanityFaqPlugin, sanityContactSectionPlugin, sanityMaterialsPlugin, sanityNewsPlugin, prepareNewsPages, prepareProductPages, sanityProductsPlugin, sanityProductPagePlugin, sanityServicesHeroPlugin } from './vite-plugin-sanity.js'

export default defineConfig(async () => {
  const newsInputs = await prepareNewsPages(__dirname)
  const productInputs = await prepareProductPages(__dirname)

  return {
    plugins: [sanityHeroPlugin(), sanityTaskCardsPlugin(), sanityStatsSectionPlugin(), sanityPartnershipPlugin(), sanityFaqPlugin(), sanityContactSectionPlugin(), sanityMaterialsPlugin(), sanityNewsPlugin(), sanityProductsPlugin(), sanityProductPagePlugin(), sanityServicesHeroPlugin()],
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
          ...productInputs,
          ...newsInputs,
        },
      },
    },
  }
})
