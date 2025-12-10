import { DocsLayout } from '@/components/geistdocs/docs-layout'
import { blogSource } from '@/lib/geistdocs/source'

const Layout = async (props: LayoutProps<'/[lang]/blog'>) => {
  const { lang } = await props.params

  return <DocsLayout tree={blogSource.pageTree[lang]} {...props} />
}

export default Layout
