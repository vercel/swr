import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type HeroProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
};

export const Hero = ({ badge, title, description, children }: HeroProps) => (
  <section className="mt-(--fd-nav-height) space-y-6 px-4 pt-16 pb-16 text-center sm:pt-24">
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Badge className="rounded-full" variant="secondary">
        <div className="size-2 rounded-full bg-muted-foreground" />
        <p>{badge}</p>
      </Badge>
      <h1 className="text-balance text-center font-semibold text-[40px]! leading-[1.1] tracking-tight sm:text-5xl! lg:font-semibold xl:text-6xl!">
        {title}
      </h1>
      <p className="mx-auto max-w-3xl text-balance text-muted-foreground leading-relaxed sm:text-xl">
        {description}
      </p>
    </div>
    {children}
  </section>
);
