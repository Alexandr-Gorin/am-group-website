export const brandCard = {
  name: 'brandCard',
  title: 'Карточка бренда (О компании)',
  type: 'document',
  fields: [
    {
      name: 'logo',
      title: 'Логотип бренда',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'logoAlt',
      title: 'Alt-текст логотипа',
      type: 'string',
    },
    {
      name: 'order',
      title: 'Порядок сортировки',
      type: 'number',
    },
  ],
}
