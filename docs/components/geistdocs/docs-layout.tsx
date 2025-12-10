import { DocsLayout as FumadocsDocsLayout } from "fumadocs-ui/layouts/docs";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import {
  Folder,
  Item,
  Separator,
  Sidebar,
} from "@/components/geistdocs/sidebar";
import { i18n } from "@/lib/geistdocs/i18n";

type DocsLayoutProps = {
  tree: ComponentProps<typeof FumadocsDocsLayout>["tree"];
  children: ReactNode;
};

export const DocsLayout = ({ tree, children }: DocsLayoutProps) => (
  <FumadocsDocsLayout
    containerProps={{
      style: {
        "--fd-docs-row-1": "4rem",
      } as CSSProperties,
    }}
    i18n={i18n}
    nav={{
      enabled: false,
    }}
    searchToggle={{
      enabled: false,
    }}
    sidebar={{
      collapsible: false,
      component: <Sidebar />,
      components: {
        Folder,
        Item,
        Separator,
      },
    }}
    tabMode="auto"
    themeSwitch={{
      enabled: false,
    }}
    tree={tree}
  >
    {children}
  </FumadocsDocsLayout>
);
