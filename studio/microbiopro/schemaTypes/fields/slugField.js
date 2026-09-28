const TRANSLIT = {
  а: 'a',  б: 'b',  в: 'v',  г: 'g',   д: 'd',
  е: 'e',  ё: 'yo', ж: 'zh', з: 'z',   и: 'i',
  й: 'y',  к: 'k',  л: 'l',  м: 'm',   н: 'n',
  о: 'o',  п: 'p',  р: 'r',  с: 's',   т: 't',
  у: 'u',  ф: 'f',  х: 'kh', ц: 'ts',  ч: 'ch',
  ш: 'sh', щ: 'shch', ъ: '', ы: 'y',   ь: '',
  э: 'e',  ю: 'yu', я: 'ya',
}

export function slugify(input) {
  let s = String(input ?? '').toLowerCase().trim()
  s = s.replace(/[а-яё]/g, (ch) => TRANSLIT[ch] ?? '')
  s = s.replace(/[\s_]+/g, '-')
  s = s.replace(/[^a-z0-9-]/g, '')
  s = s.replace(/-{2,}/g, '-')
  s = s.replace(/^-+|-+$/g, '')
  return s.slice(0, 96)
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function makeSlugField() {
  return {
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    description: 'Адрес страницы. Меняет только администратор — изменение ломает ссылки.',
    readOnly: ({currentUser}) =>
      !currentUser?.roles?.some((r) => r.name === 'administrator'),
    options: {
      source: 'title',
      slugify,
    },
    validation: (R) =>
      R.required().custom((value) => {
        const current = value?.current
        if (!current) return 'Обязательное поле'
        if (!SLUG_PATTERN.test(current))
          return 'Только латиница в нижнем регистре, цифры и дефис (например, silo-twice)'
        return true
      }),
  }
}
