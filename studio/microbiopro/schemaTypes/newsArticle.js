import {defineType, defineField} from 'sanity'

export const newsArticle = defineType({
  name: 'newsArticle',
  title: 'Новости',
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
      name: 'pageNumber',
      title: 'Page Number',
      type: 'number',
      description: 'Stable integer that maps this article to news-{N}.html. Assign once and never change.',
      validation: (R) => R.required().integer().positive(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'string',
      description: 'Short teaser shown on the homepage carousel and in related-articles blocks.',
      validation: (R) => R.required(),
    }),
    defineField({name: 'date', title: 'Date', type: 'date', validation: (R) => R.required()}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'date', media: 'image'},
  },
})
