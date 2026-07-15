export const service = {
  name: 'service',
  title: 'Услуга',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Название услуги',
      type: 'string',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    },
    {
      name: 'heroImage',
      title: 'Hero-изображение',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'heroAlt',
      title: 'Alt-текст hero-изображения',
      type: 'string',
    },
    {
      name: 'descriptionTitle',
      title: 'Заголовок описания',
      type: 'string',
    },
    {
      name: 'descriptionBody',
      title: 'Описание (Portable Text)',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Обычный', value: 'normal' },
            { title: 'Заголовок H3', value: 'h3' },
            { title: 'Заголовок H4', value: 'h4' },
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
    {
      name: 'programImage',
      title: 'Изображение программы',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'programImageAlt',
      title: 'Alt-текст изображения программы',
      type: 'string',
    },
    {
      name: 'programTitle',
      title: 'Заголовок блока программы',
      type: 'string',
    },
    {
      name: 'programDescription',
      title: 'Описание блока программы',
      type: 'text',
    },
    {
      name: 'ctaButtonText',
      title: 'Текст кнопки CTA',
      type: 'string',
      initialValue: 'Получить консультацию',
    },
  ],
}
