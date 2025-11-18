import '../global.css'
import { CommandIcon } from 'lucide-react'
import { Navbar } from '@/components/geistdocs/navbar'
import { GeistdocsProvider } from '@/components/geistdocs/provider'
import { mono, sans } from '@/lib/geistdocs/fonts'
import { cn } from '@/lib/utils'
import { defineI18nUI } from 'fumadocs-ui/i18n'
import { i18n } from '@/lib/geistdocs/i18n'
import type { ReactNode } from 'react'

const Logo = () => <CommandIcon className="size-5" />

const links = [
  {
    label: 'Docs',
    href: '/docs'
  },
  {
    label: 'Blog',
    href: '/blog'
  },
  {
    label: 'Examples',
    href: '/examples'
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
    'en-US': {
      displayName: 'English'
    },
    'fr-FR': {
      displayName: 'French'
    },
    'ja-FR': {
      displayName: 'Japanese'
    },
    ko: {
      displayName: 'Korean'
    },
    'pt-BR': {
      displayName: 'Portuguese'
    },
    ru: {
      displayName: 'Russian'
    },
    'zh-CN': {
      displayName: 'Chinese'
    }
  }
})

type LayoutProps = {
  children: ReactNode
  params: Promise<{ lang: string }>
}

const Layout = async ({ children, params }: LayoutProps) => {
  const { lang } = await params

  return (
    <html
      className={cn(sans.variable, mono.variable, 'scroll-smooth antialiased')}
      lang={lang}
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
