import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "fumadocs-ui/components/tabs.unstyled";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const CodeBlockTabsList = (props: ComponentProps<typeof TabsList>) => (
  <TabsList
    {...props}
    className={cn(
      "w-full rounded-none border-b bg-sidebar px-2.5 text-muted-foreground",
      props.className
    )}
  >
    {props.children}
  </TabsList>
);

export const CodeBlockTabsTrigger = ({
  children,
  ...props
}: ComponentProps<typeof TabsTrigger>) => (
  <TabsTrigger
    {...props}
    className={cn(
      "group relative px-1 py-2 text-sm data-[state=active]:text-primary",
      props.className
    )}
  >
    <div className="absolute inset-x-0 bottom-0 h-px group-data-[state=active]:bg-primary" />
    {children}
  </TabsTrigger>
);

export const CodeBlockTabs = ({
  ref,
  ...props
}: ComponentProps<typeof Tabs>) => (
  <Tabs
    {...props}
    className={cn(
      "overflow-hidden rounded-sm border bg-background",
      props.className
    )}
  >
    {props.children}
  </Tabs>
);

export const CodeBlockTab = (props: ComponentProps<typeof TabsContent>) => (
  <TabsContent
    {...props}
    className={cn(
      "[&>div]:mb-0 [&_pre]:rounded-none [&_pre]:border-none",
      props.className
    )}
  />
);
