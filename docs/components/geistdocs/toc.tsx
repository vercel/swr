"use client";

import { PageTOC, PageTOCItems } from "fumadocs-ui/layouts/docs/page";
import type { ReactNode } from "react";
import { useChatContext } from "@/hooks/geistdocs/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

type TableOfContentsProps = {
  children: ReactNode;
};

export const TableOfContents = ({ children }: TableOfContentsProps) => {
  const { isOpen } = useChatContext();
  const isMobile = useIsMobile();

  return (
    <PageTOC
      className={cn(
        "transition-[right]",
        isOpen && !isMobile && "right-[384px]!"
      )}
    >
      <p className="mb-1 font-medium text-sm">On this page</p>
      <PageTOCItems variant="clerk" />

      {children && (
        <div className="my-3 space-y-3">
          <Separator />
          {children}
        </div>
      )}
    </PageTOC>
  );
};
