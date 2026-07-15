import {defineType, defineField} from 'sanity'

export const statCard = defineType({
  name: 'statCard',
  title: 'Карточка статистики (главная страница)',
  type: 'document',
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
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
      name: 'order',
      title: 'Order',
      type: 'number',
    }),
  ],
  preview: {
    select: {title: 'value', subtitle: 'description'},
  },
})
