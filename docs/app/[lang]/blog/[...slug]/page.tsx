import { createRelativeLink } from 'fumadocs-ui/mdx'
import type { Metadata } from 'next'
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
import { Separator } from '@/components/ui/separator'
import { getLLMText, getPageImage, blogSource } from '@/lib/geistdocs/source'

import { Bleed } from '@/components/custom/bleed'
import Authors, { Author } from '@/components/custom/authors'
import Features from '@/components/custom/features'
import { Welcome } from '@/components/custom/diagrams/welcome'
import { Pagination } from '@/components/custom/diagrams/pagination'
import { Infinite } from '@/components/custom/diagrams/infinite'
import { Cache } from '@/components/custom/diagrams/cache'
import Link from 'next/link'

const Page = async ({ params }: PageProps<'/[lang]/blog/[...slug]'>) => {
  const { slug, lang } = await params
  const page = blogSource.getPage(slug, lang)

  if (!page) {
    notFound()
  }

  const markdown = await getLLMText(page)
  const MDX = page.data.body

  return (
    <DocsPage
      full={page.data.full}
      tableOfContent={{
        style: 'clerk',
        footer: (
          <div className="my-3 space-y-3">
            <Separator />
            <EditSource path={page.path} />
            <ScrollTop />
            <Feedback />
            <CopyPage text={markdown} />
            <AskAI href={page.url} />
            <OpenInChat href={page.url} />
          </div>
        )
      }}
      toc={page.data.toc}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(blogSource, page),

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

export const generateStaticParams = () => blogSource.generateParams()

export const generateMetadata = async ({
  params
}: PageProps<'/[lang]/blog/[...slug]'>) => {
  const { slug, lang } = await params
  const page = blogSource.getPage(slug, lang)

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
