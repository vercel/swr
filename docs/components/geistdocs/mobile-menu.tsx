"use client";

import { useSidebar } from "fumadocs-ui/contexts/sidebar";
import { MenuIcon } from "lucide-react";
import { Button } from "../ui/button";

export const MobileMenu = () => {
  const { setOpen, open } = useSidebar();

  return (
    <Button onClick={() => setOpen(!open)} size="icon-sm" variant="ghost">
      <MenuIcon className="size-4" />
    </Button>
  );
};
