import Link from "next/link";
import { Button } from "@/components/ui/button";

type CTAProps = {
  title: string;
  href: string;
  cta: string;
};

export const CTA = ({ title, href, cta }: CTAProps) => (
  <section className="flex flex-col gap-4 px-8 py-10 sm:px-12 md:flex-row md:items-center md:justify-between">
    <h2 className="font-semibold text-xl tracking-tight sm:text-2xl md:text-3xl lg:text-[40px]">
      {title}
    </h2>
    <Button asChild size="lg">
      <Link href={href}>{cta}</Link>
    </Button>
  </section>
);
