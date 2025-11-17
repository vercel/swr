import { HomeLayout } from '@/components/geistdocs/home-layout'

const Layout = ({ children }: LayoutProps<'/[lang]'>) => (
  <HomeLayout>
    <div className="bg-sidebar pt-0 pb-32">{children}</div>
  </HomeLayout>
)

export default Layout
