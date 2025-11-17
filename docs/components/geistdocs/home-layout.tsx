import { DocsLayout as FumadocsDocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/geistdocs/source";

export const HomeLayout = ({
  children,
}: Pick<LayoutProps<"/">, "children">) => (
  <FumadocsDocsLayout
    containerProps={{
      className: "p-0!",
    }}
    nav={{
      enabled: false,
    }}
    searchToggle={{
      enabled: false,
    }}
    sidebar={{
      className: "md:hidden",
    }}
    tabMode="auto"
    themeSwitch={{
      enabled: false,
    }}
    tree={source.pageTree}
  >
    {children}
  </FumadocsDocsLayout>
);
