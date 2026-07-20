import {defineType, defineField} from 'sanity'

export const taskCard = defineType({
  name: 'taskCard',
  title: 'Карточки решений (главная страница)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
    }),
    defineField({
      name: 'targetCategory',
      title: 'Target Category',
      type: 'reference',
      to: [{type: 'category'}],
    }),
    defineField({
      name: 'filterKey',
      title: 'Filter Key',
      type: 'string',
      description:
        'Must exactly match one of the static catalog page\'s filter tokens: feed-supply, byproducts, cattle, soil, seeds, plants. Do not change this value without also updating the catalog page\'s JS (catalog-filter.js).',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
    }),
  ],
  preview: {
    select: {title: 'title', media: 'icon'},
  },
})
