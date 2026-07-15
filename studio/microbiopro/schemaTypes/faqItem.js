export const faqItem = {
  name: 'faqItem',
  title: 'Вопрос-ответ — Главная страница',
  type: 'document',
  fields: [
    {
      name: 'question',
      title: 'Вопрос',
      type: 'string',
    },
    {
      name: 'answer',
      title: 'Ответ',
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
