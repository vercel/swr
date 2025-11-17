import { type InferPageType, loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'
import { docs } from '@/.source'
import { i18n } from '@/lib/geistdocs/i18n'

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  i18n,
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()]
})

export const getPageImage = (page: InferPageType<typeof source>) => {
  const segments = [...page.slugs, 'image.png']

  return {
    segments,
    url: `/og/${segments.join('/')}`
  }
}

export const getLLMText = async (page: InferPageType<typeof source>) => {
  const processed = await page.data.getText('processed')

  return `# ${page.data.title}

${processed}`
}
