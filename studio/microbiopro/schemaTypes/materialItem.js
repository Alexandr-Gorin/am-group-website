export const materialItem = {
  name: 'materialItem',
  title: 'Материал (главная страница)',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Заголовок',
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
          lists: [
            {title: 'Маркированный список', value: 'bullet'},
            {title: 'Нумерованный список', value: 'number'},
          ],
          marks: {
            decorators: [{title: 'Жирный', value: 'strong'}],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Ссылка',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
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
  orderings: [
    {
      title: 'Порядок сортировки',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
}
