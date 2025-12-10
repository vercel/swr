import { DynamicLink } from "fumadocs-core/dynamic-link";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import {
  Callout,
  CalloutContainer,
  CalloutDescription,
  CalloutTitle,
} from "./callout";
import { CodeBlock } from "./code-block";
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "./code-block-tabs";
import { Mermaid } from "./mermaid";
import { Video } from "./video";

export const getMDXComponents = (
  components?: MDXComponents
): MDXComponents => ({
  ...defaultMdxComponents,
  ...components,

  pre: CodeBlock,

  a: ({ href, ...props }) =>
    href.startsWith("/") ? (
      <DynamicLink
        className="font-normal text-primary no-underline"
        href={`/[lang]${href}`}
        {...props}
      />
    ) : (
      <a
        href={href}
        {...props}
        className="font-normal text-primary no-underline"
      />
    ),

  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  CodeBlockTab,

  TypeTable,

  Callout,
  CalloutContainer,
  CalloutTitle,
  CalloutDescription,

  Mermaid,

  Video,
});
