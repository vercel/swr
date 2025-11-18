import { HomeLayout } from '@/components/geistdocs/home-layout'

const Layout = ({ params, children }: LayoutProps<'/[lang]'>) => (
  <HomeLayout params={params}>
    <div className="bg-sidebar pt-0 pb-32">{children}</div>
  </HomeLayout>
)

export default Layout
