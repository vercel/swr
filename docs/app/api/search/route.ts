import { createFromSource } from 'fumadocs-core/search/server'
import { source } from '@/lib/geistdocs/source'

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: 'english',
  localeMap: {
    'en-US': { language: 'english' },
    'fr-FR': { language: 'french' },
    'ja-FR': { language: 'japanese' },
    'pt-BR': { language: 'portuguese' },
    'zh-CN': { language: 'chinese' },
    ko: { language: 'korean' },
    ru: { language: 'russian' }
  }
})
