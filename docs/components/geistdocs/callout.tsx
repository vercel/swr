import {
  CalloutContainer as CalloutContainerPrimitive,
  CalloutDescription as CalloutDescriptionPrimitive,
  Callout as CalloutPrimitive,
  CalloutTitle as CalloutTitlePrimitive,
} from "fumadocs-ui/components/callout";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type CalloutProps = ComponentProps<typeof CalloutPrimitive>;

export const Callout = ({ className, ...props }: CalloutProps) => (
  <CalloutPrimitive
    className={cn(
      "rounded-sm bg-transparent p-3! shadow-none [&_div[role='none']]:hidden",
      className
    )}
    {...props}
  />
);

type CalloutContainerProps = ComponentProps<typeof CalloutContainerPrimitive>;

export const CalloutContainer = (props: CalloutContainerProps) => (
  <CalloutContainerPrimitive {...props} />
);

type CalloutTitleProps = ComponentProps<typeof CalloutTitlePrimitive>;

export const CalloutTitle = (props: CalloutTitleProps) => (
  <CalloutTitlePrimitive {...props} />
);

type CalloutDescriptionProps = ComponentProps<
  typeof CalloutDescriptionPrimitive
>;

export const CalloutDescription = (props: CalloutDescriptionProps) => (
  <CalloutDescriptionPrimitive {...props} />
);
