"use client";

import DynamicLink from "fumadocs-core/dynamic-link";
import { ExternalLinkIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type DesktopMenuProps = {
  items: { label: string; href: string }[];
  className?: string;
};

export const DesktopMenu = ({ items, className }: DesktopMenuProps) => {
  const isMobile = useIsMobile();

  return (
    <NavigationMenu viewport={isMobile}>
      <NavigationMenuList className={cn("gap-px", className)}>
        {items.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink
              asChild
              className="rounded-md px-3 font-medium text-sm"
            >
              {item.href.startsWith("http") ? (
                <a
                  className="flex flex-row items-center gap-2"
                  href={item.href}
                  rel="noopener"
                  target="_blank"
                >
                  {item.label}
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              ) : (
                <DynamicLink href={`/[lang]${item.href}`}>
                  {item.label}
                </DynamicLink>
              )}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
