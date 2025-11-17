import { DocsLayout as FumadocsDocsLayout } from 'fumadocs-ui/layouts/docs'
import { source } from '@/lib/geistdocs/source'
import { i18n } from '@/lib/geistdocs/i18n'

export const HomeLayout = ({
  children
}: Pick<LayoutProps<'/'>, 'children'>) => (
  <FumadocsDocsLayout
    i18n={i18n}
    containerProps={{
      className: 'p-0!'
    }}
    nav={{
      enabled: false
    }}
    searchToggle={{
      enabled: false
    }}
    sidebar={{
      className: 'md:hidden'
    }}
    tabMode="auto"
    themeSwitch={{
      enabled: false
    }}
    tree={source.pageTree}
  >
    {children}
  </FumadocsDocsLayout>
)
