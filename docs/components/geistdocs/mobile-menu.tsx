"use client";

import { MenuIcon } from "lucide-react";
import { useSidebarContext } from "@/hooks/geistdocs/use-sidebar";
import { Button } from "../ui/button";

export const MobileMenu = () => {
  const { isOpen, setIsOpen } = useSidebarContext();

  return (
    <Button
      className="xl:hidden"
      onClick={() => setIsOpen(!isOpen)}
      size="icon-sm"
      variant="ghost"
    >
      <MenuIcon className="size-4" />
    </Button>
  );
};
