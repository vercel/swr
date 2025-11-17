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

import { Bleed } from 'nextra-theme-docs'
import { Tabs, Tab } from '@/components/geistdocs/tabs'
import Authors, { Author } from '@/components/authors'
import Features from '@/components/features'
import BlogIndex from '@/components/blog-index'
import { Welcome } from '@/components/diagrams/welcome'
import { Pagination } from '@/components/diagrams/pagination'
import { Infinite } from '@/components/diagrams/infinite'
import { Cache } from '@/components/diagrams/cache'
import Link from 'next/link'

const Page = async (props: PageProps<'/[lang]/docs/[[...slug]]'>) => {
  const params = await props.params

  const page = source.getPage(params.slug)

  if (!page) {
    notFound()
  }

  const markdown = await getLLMText(page)
  const MDX = page.data.body

  return (
    <DocsPage
      slug={params.slug}
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
            BlogIndex,
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
  props: PageProps<'/docs/[[...slug]]'>
) => {
  const params = await props.params

  return generatePageMetadata(params.slug)
}

export default Page
