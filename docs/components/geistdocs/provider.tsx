"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { SharedProps } from "fumadocs-ui/contexts/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import { type ComponentProps, useCallback } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useChatContext } from "@/hooks/geistdocs/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { i18n, i18nProvider } from "@/lib/geistdocs/i18n";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "../ui/tooltip";
import { SearchDialog } from "./search";

type GeistdocsProviderProps = ComponentProps<typeof RootProvider> & {
  basePath: string | undefined;
  className?: string;
  lang?: string;
};

export const GeistdocsProvider = ({
  basePath,
  search,
  className,
  lang = i18n.defaultLanguage,
  ...props
}: GeistdocsProviderProps) => {
  const { isOpen } = useChatContext();
  const isMobile = useIsMobile();
  const isSidebarVisible = isOpen && !isMobile;

  const SearchDialogComponent = useCallback(
    (sdProps: SharedProps) => <SearchDialog basePath={basePath} {...sdProps} />,
    [basePath]
  );

  return (
    <div
      className={cn(
        "transition-all",
        isSidebarVisible ? "pr-96!" : null,
        className
      )}
    >
      <TooltipProvider>
        <RootProvider
          i18n={i18nProvider(lang)}
          search={{
            SearchDialog: SearchDialogComponent,
            ...search,
          }}
          {...props}
        />
      </TooltipProvider>
      <Analytics />
      <Toaster />
      <SpeedInsights />
    </div>
  );
};
