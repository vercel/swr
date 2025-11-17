import { DocsLayout } from "@/components/geistdocs/docs-layout";

const Layout = ({ children }: LayoutProps<"/docs">) => (
  <DocsLayout>{children}</DocsLayout>
);

export default Layout;
