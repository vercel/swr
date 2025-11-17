import { DocsLayout } from '@/components/geistdocs/docs-layout'

const Layout = ({ children }: LayoutProps<'/[lang]/docs'>) => (
  <DocsLayout>{children}</DocsLayout>
)

export default Layout
