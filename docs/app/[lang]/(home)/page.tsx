import DynamicLink from 'fumadocs-core/dynamic-link'
import type { Metadata } from 'next'
import { Installer } from '@/components/geistdocs/installer'
import { Button } from '@/components/ui/button'
import { CenteredSection } from './components/centered-section'
import { CTA } from './components/cta'
import { Hero } from './components/hero'
import { OneTwoSection } from './components/one-two-section'
import { Templates } from './components/templates'
import { TextGridSection } from './components/text-grid-section'
import { codeToHtml } from 'shiki'
import { cn } from '@/lib/utils'

const title = 'SWR'
const description = 'React Hooks for Data Fetching.'

export const metadata: Metadata = {
  title,
  description
}

const textGridSection = [
  {
    id: '1',
    title: 'Lightweight and agnostic',
    description:
      'A small API surface with support for any data source — REST, GraphQL, or custom fetchers.'
  },
  {
    id: '2',
    title: 'Realtime and resilient',
    description:
      'Automatic background revalidation, focus/reconnect updates, and utilities for pagination and streaming.'
  },
  {
    id: '3',
    title: 'Native React ergonomics',
    description:
      'Built for Suspense, compatible with SSR and SSG, and fully typed from the ground up.'
  }
]

const exampleCode = `import useSWR from 'swr'
 
function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher)
 
  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>
  return <div>hello {data.name}!</div>
}`

const preClassNames = cn('[&_.shiki]:bg-transparent!')

const darkModeClassNames = cn(
  'dark:[&_.shiki]:text-[var(--shiki-dark)]!',
  'dark:[&_.shiki]:[font-style:var(--shiki-dark-font-style)]!',
  'dark:[&_.shiki]:[font-weight:var(--shiki-dark-font-weight)]!',
  'dark:[&_.shiki]:[text-decoration:var(--shiki-dark-text-decoration)]!',
  'dark:[&_.shiki_span]:text-[var(--shiki-dark)]!',
  'dark:[&_.shiki_span]:[font-style:var(--shiki-dark-font-style)]!',
  'dark:[&_.shiki_span]:[font-weight:var(--shiki-dark-font-weight)]!',
  'dark:[&_.shiki_span]:[text-decoration:var(--shiki-dark-text-decoration)]!'
)

const HomePage = async () => {
  const code = await codeToHtml(exampleCode, {
    lang: 'javascript',
    themes: { light: 'github-light', dark: 'github-dark' }
  })

  return (
    <div className="container mx-auto max-w-5xl">
      <Hero
        description="SWR is a minimal API with built-in caching, revalidation, and request deduplication. It keeps your UI fast, consistent, and always up to date — with a single React hook."
        title="Modern data fetching, built for React"
      >
        <div className="mx-auto inline-flex w-fit items-center gap-3">
          <Button asChild className="px-4" size="lg">
            <DynamicLink href="/[lang]/docs/getting-started">
              Get Started
            </DynamicLink>
          </Button>
          <Installer command="npm install swr" />
        </div>
      </Hero>
      <div className="grid divide-y border-y sm:border-x">
        <OneTwoSection
          description="Pass a key and a fetcher to useSWR. The hook manages the request, caches the response, and keeps data fresh. You get data, error, and isLoading to drive your UI."
          title="Fetch data with one hook"
        >
          <div
            className={cn(
              'border rounded-lg size-full overflow-auto py-4 text-sm bg-background',
              preClassNames,
              darkModeClassNames
            )}
            dangerouslySetInnerHTML={{ __html: code }}
          />
        </OneTwoSection>
        <CenteredSection
          description="The name “SWR” is derived from stale-while-revalidate, a HTTP cache invalidation strategy popularized by HTTP RFC 5861."
          title="Fetch, request and revalidate"
        />
        <TextGridSection data={textGridSection} />
        <CTA cta="Get started" href="/docs" title="Start building with SWR" />
      </div>
    </div>
  )
}

export default HomePage
