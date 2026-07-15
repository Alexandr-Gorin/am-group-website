export const contactSection = {
  name: 'contactSection',
  title: 'Форма обратной связи — Главная страница',
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
      name: 'buttonText',
      title: 'Текст кнопки отправки',
      type: 'string',
      initialValue: 'Получить консультацию',
    },
    {
      name: 'consentText',
      title: 'Текст согласия на обработку данных',
      type: 'string',
      initialValue:
        'Нажимая «Отправить», я подтверждаю согласие на обработку персональных данных согласно Политике конфиденциальности.',
    },
    {
      name: 'newsletterText',
      title: 'Текст чекбокса рассылки',
      type: 'string',
      initialValue: 'Согласен(на) на получение рекламных и информационных рассылок.',
    },
    {
      name: 'backgroundImage',
      title: 'Фоновое изображение',
      type: 'image',
    },
  ],
}
