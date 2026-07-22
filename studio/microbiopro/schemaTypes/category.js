import {defineType, defineField} from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Категория (страница Продукция)',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (R) => R.required()}),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
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
      name: 'filterKey',
      title: 'Filter Key',
      type: 'string',
      description: 'English slug used as data-filter on the catalog panel button (e.g. feed-supply, byproducts, cattle, soil). Must be unique and URL-safe.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
    }),
  ],
})
