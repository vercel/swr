import {
  DocsBody as FumadocsDocsBody,
  DocsDescription as FumadocsDocsDescription,
  DocsPage as FumadocsDocsPage,
  DocsTitle as FumadocsDocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentProps, CSSProperties } from "react";
import { getPageImage, source } from "@/lib/geistdocs/source";
import { cn } from "@/lib/utils";

const containerStyle = {
  "--fd-nav-height": "4rem",
} as CSSProperties;

type PageProps = ComponentProps<typeof FumadocsDocsPage> & {
  slug: string[] | undefined;
};

export const DocsPage = ({ slug, children, ...props }: PageProps) => {
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <FumadocsDocsPage
      full={page.data.full}
      toc={page.data.toc}
      {...props}
      article={{ className: "max-w-[754px]", ...props.article }}
      container={{
        style: containerStyle,
        className: "col-span-2",
        ...props.container,
      }}
    >
      {children}
    </FumadocsDocsPage>
  );
};

export const DocsTitle = ({
  className,
  ...props
}: ComponentProps<typeof FumadocsDocsTitle>) => (
  <FumadocsDocsTitle
    className={cn("text-4xl tracking-tight", className)}
    {...props}
  />
);

export const DocsDescription = (
  props: ComponentProps<typeof FumadocsDocsDescription>
) => <FumadocsDocsDescription {...props} />;

export const DocsBody = ({
  className,
  ...props
}: ComponentProps<typeof FumadocsDocsBody>) => (
  <FumadocsDocsBody className={cn("mx-auto w-full", className)} {...props} />
);

export const generateStaticPageParams = () => source.generateParams();

export const generatePageMetadata = (slug: PageProps["slug"]) => {
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const metadata: Metadata = {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };

  return metadata;
};
