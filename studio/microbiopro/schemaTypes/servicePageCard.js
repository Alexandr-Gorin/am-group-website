export const servicePageCard = {
  name: 'servicePageCard',
  title: 'Карточка услуги',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Название',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Описание',
      type: 'text',
    },
    {
      name: 'buttonText',
      title: 'Текст кнопки',
      type: 'string',
    },
    {
      name: 'targetService',
      title: 'Страница услуги',
      type: 'reference',
      to: [{type: 'service'}],
    },
  ],
}
