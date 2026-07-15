export const servicesFeedbackSection = {
  name: 'servicesFeedbackSection',
  title: 'Страница Услуги — Форма обратной связи',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'heading',
      title: 'Заголовок',
      type: 'string',
      initialValue: 'Остались вопросы?',
    },
    {
      name: 'subheading',
      title: 'Подзаголовок',
      type: 'string',
      initialValue: 'Оставьте заявку и наши специалисты свяжутся с Вами в ближайшее время.',
    },
    {
      name: 'backgroundImage',
      title: 'Фоновое изображение',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'companyPlaceholder',
      title: 'Плейсхолдер поля «Название компании»',
      type: 'string',
      initialValue: 'Название компании',
    },
    {
      name: 'namePlaceholder',
      title: 'Плейсхолдер поля «ФИО»',
      type: 'string',
      initialValue: 'ФИО',
    },
    {
      name: 'phonePlaceholder',
      title: 'Плейсхолдер поля «Телефон»',
      type: 'string',
      initialValue: 'Телефон',
    },
    {
      name: 'buttonText',
      title: 'Текст кнопки отправки',
      type: 'string',
      initialValue: 'Получить консультацию',
    },
    {
      name: 'consentText',
      title: 'Текст согласия на обработку данных',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      name: 'checkboxText',
      title: 'Текст чекбокса рассылки',
      type: 'string',
      initialValue: 'Согласен(на) на получение рекламных и информационных рассылок.',
    },
  ],
}
