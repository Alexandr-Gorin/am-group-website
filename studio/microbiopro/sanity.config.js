import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Microbio.pro',

  projectId: 'b33hwgh0',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    presentationTool({
      previewUrl: 'https://microbio.pro/?preview=amg-preview-2026',
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
