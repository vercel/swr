import { DocsLayout } from "@/components/geistdocs/docs-layout";
import { source } from "@/lib/geistdocs/source";

const Layout = async ({ children, params }: LayoutProps<"/[lang]/docs">) => {
  const { lang } = await params;

  return <DocsLayout tree={source.pageTree[lang]}>{children}</DocsLayout>;
};

export default Layout;
