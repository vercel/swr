import './global.css'
import { CommandIcon } from 'lucide-react'
import { Navbar } from '@/components/geistdocs/navbar'
import { GeistdocsProvider } from '@/components/geistdocs/provider'
import { mono, sans } from '@/lib/geistdocs/fonts'
import { cn } from '@/lib/utils'
import { defineI18nUI } from 'fumadocs-ui/i18n'
import { i18n } from '@/lib/geistdocs/i18n'

const Logo = () => <CommandIcon className="size-5" />

const links = [
  {
    label: 'Docs',
    href: '/docs'
  }
]

const suggestions = [
  'What is Vercel?',
  'What can I deploy with Vercel?',
  'What is Fluid Compute?',
  'How much does Vercel cost?'
]

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English'
    },
    cn: {
      displayName: 'Chinese',
      search: '搜尋文檔'
    }
  }
})

type Params = Promise<{ lang: string }>

const Layout = async ({
  children,
  params
}: {
  children: React.ReactNode
  params: Params
}) => {
  const { lang } = await params

  return (
    <html
      className={cn(sans.variable, mono.variable, 'scroll-smooth antialiased')}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <GeistdocsProvider i18n={provider(lang)}>
          <Navbar items={links} suggestions={suggestions}>
            <Logo />
          </Navbar>
          {children}
        </GeistdocsProvider>
      </body>
    </html>
  )
}

export default Layout
