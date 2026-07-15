import {defineType, defineField} from 'sanity'

export const statsSection = defineType({
  name: 'statsSection',
  title: 'Доказанная эффективность — Главная страница',
  type: 'document',
  __experimental_omnisearch_visibility: false,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'heading'},
  },
})
