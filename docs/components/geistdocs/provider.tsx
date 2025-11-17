"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ComponentProps } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useChatContext } from "@/hooks/geistdocs/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "../ui/tooltip";
import { SearchDialog } from "./search";

type GeistdocsProviderProps = ComponentProps<typeof RootProvider> & {
  basePath?: string;
  className?: string;
};

export const GeistdocsProvider = ({
  basePath = "",
  search,
  className,
  ...props
}: GeistdocsProviderProps) => {
  const apiPath = `${basePath}/api/search`;
  const { isOpen } = useChatContext();
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "transition-all",
        isOpen && !isMobile && "pr-[384px]!",
        className
      )}
    >
      <TooltipProvider>
        <RootProvider
          search={{
            SearchDialog,
            options: {
              api: apiPath,
            },
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
