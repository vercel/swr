import { createRelativeLink } from 'fumadocs-ui/mdx'
import { notFound } from 'next/navigation'
import { AskAI } from '@/components/geistdocs/ask-ai'
import { CopyPage } from '@/components/geistdocs/copy-page'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from '@/components/geistdocs/docs-page'
import { EditSource } from '@/components/geistdocs/edit-source'
import { Feedback } from '@/components/geistdocs/feedback'
import { getMDXComponents } from '@/components/geistdocs/mdx-components'
import { OpenInChat } from '@/components/geistdocs/open-in-chat'
import { ScrollTop } from '@/components/geistdocs/scroll-top'
import { TableOfContents } from '@/components/geistdocs/toc'
import { getLLMText, getPageImage, source } from '@/lib/geistdocs/source'

import { Bleed } from '@/components/custom/bleed'
import Authors, { Author } from '@/components/custom/authors'
import Features from '@/components/custom/features'
import { Welcome } from '@/components/custom/diagrams/welcome'
import { Pagination } from '@/components/custom/diagrams/pagination'
import { Infinite } from '@/components/custom/diagrams/infinite'
import { Cache } from '@/components/custom/diagrams/cache'
import Link from 'next/link'
import type { Metadata } from 'next'

const Page = async (props: PageProps<'/[lang]/docs/[[...slug]]'>) => {
  const params = await props.params

  const page = source.getPage(params.slug, params.lang)

  if (!page) {
    notFound()
  }

  const markdown = await getLLMText(page)
  const MDX = page.data.body

  return (
    <DocsPage
      full={page.data.full}
      toc={page.data.toc}
      tableOfContent={{
        component: (
          <TableOfContents>
            <EditSource path={page.path} />
            <ScrollTop />
            <Feedback />
            <CopyPage text={markdown} />
            <AskAI href={page.url} />
            <OpenInChat href={page.url} />
          </TableOfContents>
        )
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),

            // Add your custom components here
            Bleed,
            Authors,
            Author,
            Features,
            Welcome,
            Pagination,
            Infinite,
            Cache,
            Link
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export const generateStaticParams = () => source.generateParams()

export const generateMetadata = async (
  props: PageProps<'/[lang]/docs/[[...slug]]'>
) => {
  const { slug, lang } = await props.params
  const page = source.getPage(slug, lang)

  if (!page) {
    notFound()
  }

  const metadata: Metadata = {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url
    }
  }

  return metadata
}

export default Page
