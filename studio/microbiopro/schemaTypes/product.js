import {defineType, defineField} from 'sanity'

export const product = defineType({
  name: 'product',
  title: 'Продукция',
  type: 'document',
  groups: [
    {name: 'card', title: 'Catalog Card'},
    {name: 'page', title: 'Product Page'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'card',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'card',
      options: {source: 'title'},
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'card',
      to: [{type: 'category'}],
    }),
    defineField({
      name: 'filterTags',
      title: 'Filter Tags',
      type: 'array',
      group: 'card',
      of: [{type: 'string'}],
      description: 'All filter tokens for this product (e.g. ["soil", "seeds", "plants"]). Joined as data-category on the catalog card. Must include the parent category filterKey plus any sub-tokens.',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
      group: 'card',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'array',
      group: 'card',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'buttonType',
      title: 'Button Type',
      type: 'string',
      group: 'card',
      options: {
        list: [
          {title: 'Primary', value: 'primary'},
          {title: 'Secondary', value: 'secondary'},
        ],
        layout: 'radio',
      },
      initialValue: 'primary',
    }),
    defineField({
      name: 'pageTitle',
      title: 'Page Title',
      type: 'string',
      group: 'page',
    }),
    defineField({
      name: 'certificates',
      title: 'Certificates',
      type: 'array',
      group: 'page',
      of: [{type: 'image'}],
    }),
    defineField({
      name: 'descriptionTitle',
      title: 'Description Title',
      type: 'string',
      group: 'page',
    }),
    defineField({
      name: 'descriptionBody',
      title: 'Description Body',
      type: 'text',
      rows: 4,
      group: 'page',
    }),
    defineField({
      name: 'purpose',
      title: 'Назначение (Purpose)',
      type: 'array',
      group: 'page',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {decorators: [{title: 'Strong', value: 'strong'}]},
        },
      ],
    }),
    defineField({
      name: 'composition',
      title: 'Состав (Composition)',
      type: 'array',
      group: 'page',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {decorators: [{title: 'Strong', value: 'strong'}]},
        },
      ],
    }),
    defineField({
      name: 'application',
      title: 'Применение (Application)',
      type: 'array',
      group: 'page',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [
            {title: 'Bullet', value: 'bullet'},
            {title: 'Numbered', value: 'number'},
          ],
          marks: {decorators: [{title: 'Strong', value: 'strong'}]},
        },
      ],
    }),
    defineField({
      name: 'researchResults',
      title: 'Research Results',
      type: 'array',
      group: 'page',
      of: [{type: 'image'}],
      description: 'Scanned pages of lab research results, shown as a carousel on the product page.',
    }),
  ],
  preview: {
    select: {title: 'title', media: 'mainImage.0'},
  },
})
