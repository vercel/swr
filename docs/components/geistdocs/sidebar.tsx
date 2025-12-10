"use client";

import type { Node } from "fumadocs-core/page-tree";
import {
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  SidebarSeparator,
} from "fumadocs-ui/components/sidebar/base";
import type { SidebarPageTreeComponents } from "fumadocs-ui/components/sidebar/page-tree";
import { useTreeContext, useTreePath } from "fumadocs-ui/contexts/tree";
import { Fragment } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebarContext } from "@/hooks/geistdocs/use-sidebar";
import { SearchButton } from "./search";

export const Sidebar = () => {
  const { root } = useTreeContext();
  const { isOpen, setIsOpen } = useSidebarContext();

  const renderSidebarList = (items: Node[]) =>
    items.map((item) => {
      if (item.type === "separator") {
        return <Separator item={item} key={item.$id} />;
      }

      if (item.type === "folder") {
        const children = renderSidebarList(item.children);
        return (
          <Folder item={item} key={item.$id}>
            {children}
          </Folder>
        );
      }

      return <Item item={item} key={item.$id} />;
    });

  return (
    <div
      className="pointer-events-none sticky top-(--fd-docs-row-1) z-20 h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] [grid-area:sidebar] *:pointer-events-auto max-md:hidden md:layout:[--fd-sidebar-width:268px]"
      data-sidebar-placeholder
    >
      <div className="px-4 pt-12 pb-4 h-full overflow-y-auto">
        <Fragment key={root.$id}>{renderSidebarList(root.children)}</Fragment>
      </div>
      <Sheet onOpenChange={setIsOpen} open={isOpen}>
        <SheetContent className="gap-0">
          <SheetHeader className="mt-8">
            <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Navigation for the documentation.
            </SheetDescription>
            <SearchButton onClick={() => setIsOpen(false)} />
          </SheetHeader>
          <div className="px-4">{renderSidebarList(root.children)}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export const Folder: SidebarPageTreeComponents["Folder"] = ({
  children,
  item,
}) => {
  const path = useTreePath();
  const defaultOpen = item.defaultOpen ?? path.includes(item);

  return (
    <SidebarFolder defaultOpen={defaultOpen}>
      {item.index ? (
        <SidebarFolderLink
          className="flex items-center gap-2 text-pretty py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground data-[active=true]:text-foreground [&_svg]:size-3.5"
          external={item.index.external}
          href={item.index.url}
        >
          {item.icon}
          {item.name}
        </SidebarFolderLink>
      ) : (
        <SidebarFolderTrigger className="flex items-center gap-2 text-pretty py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground [&_svg]:size-3.5">
          {item.icon}
          {item.name}
        </SidebarFolderTrigger>
      )}
      <SidebarFolderContent className="ml-2">{children}</SidebarFolderContent>
    </SidebarFolder>
  );
};

export const Item: SidebarPageTreeComponents["Item"] = ({ item }) => (
  <SidebarItem
    className="block w-full truncate text-pretty py-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground data-[active=true]:text-foreground"
    external={item.external}
    href={item.url}
    icon={item.icon}
  >
    {item.name}
  </SidebarItem>
);

export const Separator: SidebarPageTreeComponents["Separator"] = ({ item }) => (
  <SidebarSeparator className="mt-4 mb-2 flex items-center gap-2 px-0 font-medium text-sm first-child:mt-0">
    {item.icon}
    {item.name}
  </SidebarSeparator>
);
