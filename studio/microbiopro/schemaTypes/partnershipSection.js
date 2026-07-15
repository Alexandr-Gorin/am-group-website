export const partnershipSection = {
  name: 'partnershipSection',
  title: 'Партнёрство — Главная страница',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'heading',
      title: 'Заголовок раздела',
      type: 'string',
      initialValue: 'Партнёрство для дистрибьюторов',
    },
    {
      name: 'subheading',
      title: 'Текст под заголовком',
      type: 'string',
      initialValue:
        'Расширяйте свой портфель инновационными продуктами, которые действительно работают и востребованы рынком.',
    },
    {
      name: 'buttonText',
      title: 'Текст кнопки CTA',
      type: 'string',
      initialValue: 'Стать партнёром',
    },
  ],
}
