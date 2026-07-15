export const servicesHero = {
  name: 'servicesHero',
  title: 'Страница Услуги — Hero блок',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  fields: [
    {
      name: 'heading',
      title: 'Заголовок',
      type: 'string',
      initialValue: 'Экспертные услуги для кормопроизводства и кормозаготовки',
    },
    {
      name: 'subheading',
      title: 'Подзаголовок',
      type: 'text',
      initialValue:
        'Помогаем повысить эффективность кормовой базы за счёт внедрения современных технологий, оптимизации процессов и профессионального сопровождения на всех этапах.',
    },
    {
      name: 'image',
      title: 'Изображение',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
  ],
}
