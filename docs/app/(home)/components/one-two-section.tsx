import type { ReactNode } from "react";

type OneTwoSectionProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export const OneTwoSection = ({
  title,
  description,
  children,
}: OneTwoSectionProps) => (
  <div className="grid gap-12 p-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:p-0">
    <div className="flex flex-col gap-2 text-balance sm:p-12">
      <h2 className="font-semibold text-xl tracking-tight sm:text-2xl md:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-balance text-lg text-muted-foreground">
        {description}
      </p>
    </div>
    <div className="col-span-2 sm:p-12">{children}</div>
  </div>
);
