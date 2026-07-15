export const aboutHero = {
  name: 'aboutHero',
  title: 'Страница О компании — Hero блок',
  type: 'document',
  fields: [
    {
      name: 'eyebrow',
      title: 'Надпись над заголовком',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Главный заголовок',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Описание',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Обычный', value: 'normal' },
          ],
          lists: [
            { title: 'Маркированный список', value: 'bullet' },
          ],
          marks: {
            decorators: [
              { title: 'Жирный', value: 'strong' },
              { title: 'Курсив', value: 'em' },
            ],
          },
        },
      ],
    },
  ],
}
