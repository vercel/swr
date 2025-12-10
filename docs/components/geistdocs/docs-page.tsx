import {
  DocsBody as FumadocsDocsBody,
  DocsDescription as FumadocsDocsDescription,
  DocsPage as FumadocsDocsPage,
  DocsTitle as FumadocsDocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type PageProps = ComponentProps<typeof FumadocsDocsPage>;

export const DocsPage = ({ ...props }: PageProps) => (
  <FumadocsDocsPage {...props} />
);

export const DocsTitle = ({
  className,
  ...props
}: ComponentProps<typeof FumadocsDocsTitle>) => (
  <FumadocsDocsTitle
    className={cn("mb-4 text-4xl tracking-tight", className)}
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
