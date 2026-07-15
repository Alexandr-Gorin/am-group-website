export const aboutMissionSection = {
  name: 'aboutMissionSection',
  title: 'Страница О компании — Миссия компании',
  type: 'document',
  fields: [
    {
      name: 'photo',
      title: 'Фото генерального директора',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'photoAlt',
      title: 'Alt-текст фото',
      type: 'string',
    },
    {
      name: 'label',
      title: 'Метка над письмом',
      type: 'string',
    },
    {
      name: 'greeting',
      title: 'Приветственная строка',
      type: 'string',
    },
    {
      name: 'body',
      title: 'Текст письма',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Обычный', value: 'normal'},
          ],
          lists: [
            {title: 'Маркированный список', value: 'bullet'},
          ],
          marks: {
            decorators: [
              {title: 'Жирный', value: 'strong'},
              {title: 'Курсив', value: 'em'},
            ],
          },
        },
      ],
    },
    {
      name: 'signatureName',
      title: 'Имя подписанта',
      type: 'string',
    },
    {
      name: 'signaturePosition',
      title: 'Должность подписанта',
      type: 'string',
    },
  ],
}
