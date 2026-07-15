export const partnerCard = {
  name: 'partnerCard',
  title: 'Карточка партнёрства (главная страница)',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Заголовок карточки',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Описание',
      type: 'text',
    },
    {
      name: 'image',
      title: 'Фото',
      type: 'image',
      options: {
        hotspot: true,
      },
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
