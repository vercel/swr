"use client";

import { ArrowUpCircleIcon } from "lucide-react";
import { useCallback } from "react";

export const ScrollTop = () => {
  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
      className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      onClick={handleScrollToTop}
      type="button"
    >
      <ArrowUpCircleIcon className="size-3.5" />
      <span>Scroll to top</span>
    </button>
  );
};
