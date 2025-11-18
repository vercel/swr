import '../global.css'
import { Navbar } from '@/components/geistdocs/navbar'
import { GeistdocsProvider } from '@/components/geistdocs/provider'
import { mono, sans } from '@/lib/geistdocs/fonts'
import { cn } from '@/lib/utils'
import { defineI18nUI } from 'fumadocs-ui/i18n'
import { i18n } from '@/lib/geistdocs/i18n'
import type { ReactNode } from 'react'

const Logo = () => (
  <div className="flex items-center hover:opacity-75 ltr:mr-auto rtl:ml-auto">
    <svg height="12" viewBox="0 0 291 69" fill="none">
      <path
        d="M0 36.53c.07 17.6 14.4 32.01 32.01 32.01a32.05 32.05 0 0032.01-32V32a13.2 13.2 0 0123.4-8.31h20.7A32.07 32.07 0 0077.2 0a32.05 32.05 0 00-32 32.01v4.52A13.2 13.2 0 0132 49.71a13.2 13.2 0 01-13.18-13.18 3.77 3.77 0 00-3.77-3.77H3.76A3.77 3.77 0 000 36.53zM122.49 68.54a32.14 32.14 0 01-30.89-23.7h20.67a13.16 13.16 0 0023.4-8.3V32A32.05 32.05 0 01167.68 0c17.43 0 31.64 14 32 31.33l.1 5.2a13.2 13.2 0 0023.4 8.31h20.7a32.07 32.07 0 01-30.91 23.7c-17.61 0-31.94-14.42-32.01-32l-.1-4.7v-.2a13.2 13.2 0 00-13.18-12.81 13.2 13.2 0 00-13.18 13.18v4.52a32.05 32.05 0 01-32.01 32.01zM247.94 23.7a13.16 13.16 0 0123.4 8.31 3.77 3.77 0 003.77 3.77h11.3a3.77 3.77 0 003.76-3.77A32.05 32.05 0 00258.16 0a32.07 32.07 0 00-30.92 23.7h20.7z"
        fill="currentColor"
      />
    </svg>
    <span className="mx-2 font-extrabold hidden md:inline select-none">
      SWR
    </span>
  </div>
)

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
