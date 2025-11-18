import {
  DocsBody as FumadocsDocsBody,
  DocsDescription as FumadocsDocsDescription,
  DocsPage as FumadocsDocsPage,
  DocsTitle as FumadocsDocsTitle
} from 'fumadocs-ui/page'
import type { ComponentProps, CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const containerStyle = {
  '--fd-nav-height': '4rem'
} as CSSProperties

type PageProps = ComponentProps<typeof FumadocsDocsPage>

export const DocsPage = ({ children, container, ...props }: PageProps) => (
  <FumadocsDocsPage
    {...props}
    article={{ className: 'max-w-[754px]', ...props.article }}
    container={{
      style: containerStyle,
      className: 'col-span-2',
      ...container
    }}
  >
    {children}
  </FumadocsDocsPage>
)

export const DocsTitle = ({
  className,
  ...props
}: ComponentProps<typeof FumadocsDocsTitle>) => (
  <FumadocsDocsTitle
    className={cn('text-4xl tracking-tight', className)}
    {...props}
  />
)

export const DocsDescription = (
  props: ComponentProps<typeof FumadocsDocsDescription>
) => <FumadocsDocsDescription {...props} />

export const DocsBody = ({
  className,
  ...props
}: ComponentProps<typeof FumadocsDocsBody>) => (
  <FumadocsDocsBody className={cn('mx-auto w-full', className)} {...props} />
)
