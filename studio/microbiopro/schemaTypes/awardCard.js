export const awardCard = {
  name: 'awardCard',
  title: 'Страница О компании — Награды',
  type: 'document',
  fields: [
    {
      name: 'image',
      title: 'Изображение награды',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'imageAlt',
      title: 'Alt-текст изображения',
      type: 'string',
    },
    {
      name: 'order',
      title: 'Порядок сортировки',
      type: 'number',
    },
  ],
}
