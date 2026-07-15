export const cookieSection = {
  name: 'cookieSection',
  title: 'Блок страницы Файлы cookie',
  type: 'document',
  fields: [
    {
      name: 'sectionTitle',
      title: 'Заголовок блока',
      type: 'string',
    },
    {
      name: 'body',
      title: 'Содержимое',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [{title: 'Bullet', value: 'bullet'}],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
            ],
          },
        },
      ],
    },
    {
      name: 'order',
      title: 'Порядок сортировки',
      type: 'number',
    },
  ],
  preview: {
    select: {title: 'sectionTitle', subtitle: 'order'},
    prepare({title, subtitle}) {
      return {title, subtitle: subtitle != null ? `Порядок: ${subtitle}` : ''}
    },
  },
  orderings: [
    {
      title: 'По порядку',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
}
