import { DocsLayout } from '@/components/geistdocs/docs-layout'
import { examplesSource } from '@/lib/geistdocs/source'

const Layout = async (props: LayoutProps<'/[lang]/docs'>) => {
  const { lang } = await props.params

  return <DocsLayout tree={examplesSource.pageTree[lang]} {...props} />
}

export default Layout
