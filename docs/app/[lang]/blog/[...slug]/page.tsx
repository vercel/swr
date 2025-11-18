import { createRelativeLink } from 'fumadocs-ui/mdx'
import { notFound } from 'next/navigation'
import { AskAI } from '@/components/geistdocs/ask-ai'
import { CopyPage } from '@/components/geistdocs/copy-page'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  generatePageMetadata,
  generateStaticPageParams
} from '@/components/geistdocs/docs-page'
import { EditSource } from '@/components/geistdocs/edit-source'
import { Feedback } from '@/components/geistdocs/feedback'
import { getMDXComponents } from '@/components/geistdocs/mdx-components'
import { OpenInChat } from '@/components/geistdocs/open-in-chat'
import { ScrollTop } from '@/components/geistdocs/scroll-top'
import { TableOfContents } from '@/components/geistdocs/toc'
import { getLLMText, source } from '@/lib/geistdocs/source'

import { Bleed } from '@/components/custom/bleed'
import { Tabs, Tab } from 'fumadocs-ui/components/tabs'
import Authors, { Author } from '@/components/custom/authors'
import Features from '@/components/custom/features'
import { Welcome } from '@/components/custom/diagrams/welcome'
import { Pagination } from '@/components/custom/diagrams/pagination'
import { Infinite } from '@/components/custom/diagrams/infinite'
import { Cache } from '@/components/custom/diagrams/cache'
import Link from 'next/link'

const Page = async (props: PageProps<'/[lang]/blog/[[...slug]]'>) => {
  const params = await props.params

  const page = source.getPage(params.slug, params.lang)

  if (!page) {
    notFound()
  }

  const markdown = await getLLMText(page)
  const MDX = page.data.body

  return (
    <DocsPage
      slug={params.slug}
      lang={params.lang}
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
      toc={page.data.toc}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),

            // Add your custom components here
            Bleed,
            Tabs,
            Tab,
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

export const generateStaticParams = generateStaticPageParams

export const generateMetadata = async (
  props: PageProps<'/[lang]/blog/[[...slug]]'>
) => {
  const params = await props.params

  return generatePageMetadata(params.slug, params.lang)
}

export default Page
