import { HomeLayout } from "@/components/geistdocs/home-layout";
import { source } from "@/lib/geistdocs/source";

const Layout = async ({ children, params }: LayoutProps<"/[lang]">) => {
  const { lang } = await params;

  return (
    <HomeLayout tree={source.pageTree[lang]}>
      <div className="bg-sidebar pt-0 pb-32">{children}</div>
    </HomeLayout>
  );
};

export default Layout;
