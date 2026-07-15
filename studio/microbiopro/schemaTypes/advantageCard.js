export const advantageCard = {
  name: 'advantageCard',
  title: 'Карточка преимущества (О компании)',
  type: 'document',
  fields: [
    {
      name: 'icon',
      title: 'Иконка',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'title',
      title: 'Заголовок карточки',
      type: 'string',
    },
    {
      name: 'subtitle',
      title: 'Подзаголовок',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Описание',
      type: 'text',
    },
    {
      name: 'order',
      title: 'Порядок сортировки',
      type: 'number',
    },
  ],
}
