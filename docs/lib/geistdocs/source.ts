import { type InferPageType, loader } from 'fumadocs-core/source'
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons'
import { blog, docs, examples } from '@/.source/server'
import { basePath } from '@/geistdocs'
import { i18n } from './i18n'

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  i18n,
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()]
})

export const examplesSource = loader({
  i18n,
  baseUrl: '/examples',
  source: examples.toFumadocsSource(),
  plugins: [lucideIconsPlugin()]
})

export const blogSource = loader({
  i18n,
  baseUrl: '/blog',
  source: blog.toFumadocsSource(),
  plugins: [lucideIconsPlugin()]
})

export const getPageImage = (page: InferPageType<typeof source>) => {
  const segments = [...page.slugs, 'image.png']

  return {
    segments,
    url: basePath
      ? `${basePath}/og/${segments.join('/')}`
      : `/og/${segments.join('/')}`
  }
}

export const getLLMText = async (page: InferPageType<typeof source>) => {
  const processed = await page.data.getText('processed')

  return `# ${page.data.title}

${processed}`
}
