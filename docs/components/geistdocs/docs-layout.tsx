import { DocsLayout as FumadocsDocsLayout } from 'fumadocs-ui/layouts/docs'
import { Folder, Item, Separator } from '@/components/geistdocs/sidebar'
import { i18n } from '@/lib/geistdocs/i18n'
import type { ComponentProps } from 'react'
import type { ReactNode } from 'react'

type DocsLayoutProps = {
  children: ReactNode
  tree: ComponentProps<typeof FumadocsDocsLayout>['tree']
}

export const DocsLayout = ({ children, tree }: DocsLayoutProps) => (
  <FumadocsDocsLayout
    i18n={i18n}
    containerProps={{
      className:
        'md:grid md:grid-cols-[286px_1fr_286px] md:pl-0! md:mx-auto! md:w-full md:max-w-(--fd-layout-width)!'
    }}
    nav={{
      enabled: false
    }}
    searchToggle={{
      enabled: false
    }}
    sidebar={{
      className:
        'md:static md:sticky md:top-16 md:h-fit md:w-auto! bg-background! md:bg-transparent! border-none transition-none [&>div:last-child]:hidden',
      collapsible: false,
      components: {
        Folder,
        Item,
        Separator
      }
    }}
    tabMode="auto"
    themeSwitch={{
      enabled: false
    }}
    tree={tree}
  >
    {children}
  </FumadocsDocsLayout>
)
