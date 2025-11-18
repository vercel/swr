import { DocsLayout } from '@/components/geistdocs/docs-layout'
import { source } from '@/lib/geistdocs/source'

const Layout = async (props: LayoutProps<'/[lang]/docs'>) => {
  const { lang } = await props.params

  return <DocsLayout tree={source.pageTree[lang]} {...props} />
}

export default Layout
