export const cookiePage = {
  name: 'cookiePage',
  title: 'Страница Файлы cookie',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Заголовок страницы',
      type: 'string',
    },
    {
      name: 'intro',
      title: 'Вводный абзац',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
            ],
          },
        },
      ],
    },
  ],
}
