import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'b33hwgh0',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  ...(process.env.SANITY_API_TOKEN && { token: process.env.SANITY_API_TOKEN }),
})

const builder = createImageUrlBuilder(sanityClient)

export function urlFor(source) {
  return builder.image(source)
}
