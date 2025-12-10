import DynamicLink from 'fumadocs-core/dynamic-link'
import type { Metadata } from 'next'
import { Installer } from '@/components/geistdocs/installer'
import { Button } from '@/components/ui/button'
import { CenteredSection } from './components/centered-section'
import { CTA } from './components/cta'
import { Hero } from './components/hero'
import { OneTwoSection } from './components/one-two-section'
import { TextGridSection } from './components/text-grid-section'
import { codeToHtml } from 'shiki'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import * as copy from './copy'

export const metadata: Metadata = {
  title: copy.metadata.en.title,
  description: copy.metadata.en.description
}

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

type PageProps = {
  params: Promise<{
    lang: keyof typeof copy.metadata
  }>
}

const HomePage = async ({ params }: PageProps) => {
  const { lang } = await params
  const code = await codeToHtml(exampleCode, {
    lang: 'javascript',
    themes: { light: 'github-light', dark: 'github-dark' }
  })

  return (
    <div className="container mx-auto max-w-5xl">
      <Hero
        description={copy.hero[lang].description}
        title={copy.hero[lang].title}
      >
        <div className="mx-auto inline-flex w-fit items-center gap-3">
          <Button asChild className="px-4" size="lg">
            <DynamicLink href="/[lang]/docs/getting-started">
              {copy.buttons[lang].getStarted}
            </DynamicLink>
          </Button>
          <Installer command="npm install swr" />
        </div>
      </Hero>
      <div className="grid divide-y border-y sm:border-x">
        <OneTwoSection
          description={copy.oneTwoSection[lang].description}
          title={copy.oneTwoSection[lang].title}
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
          description={copy.centeredSection[lang].description}
          title={copy.centeredSection[lang].title}
        >
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {copy.features[lang].map(feature => (
              <Badge key={feature} variant="outline" className="text-sm">
                {feature}
              </Badge>
            ))}
          </div>
        </CenteredSection>
        <TextGridSection data={copy.textGridSection[lang]} />
        <CTA
          cta={copy.cta[lang].cta}
          href="/docs"
          title={copy.cta[lang].title}
        />
      </div>
    </div>
  )
}

export default HomePage
