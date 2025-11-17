import type { ReactNode } from "react";

type CenteredSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export const CenteredSection = ({
  title,
  description,
  children,
}: CenteredSectionProps) => (
  <div className="grid items-center gap-10 overflow-hidden px-4 py-8 sm:px-12 sm:py-12">
    <div className="mx-auto grid max-w-lg gap-4 text-center">
      <h2 className="font-semibold text-xl tracking-tight sm:text-2xl md:text-3xl lg:text-[40px]">
        {title}
      </h2>
      <p className="text-balance text-lg text-muted-foreground">
        {description}
      </p>
    </div>

    {children}
  </div>
);
