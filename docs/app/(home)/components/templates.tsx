import Image from "next/image";
import { cn } from "@/lib/utils";

type TemplatesProps = {
  title: string;
  description: string;
  data: {
    title: string;
    description: string;
    link: string;
    image: string;
  }[];
};

export const Templates = ({ title, description, data }: TemplatesProps) => (
  <div className="grid gap-12 p-8 px-4 py-8 sm:p-12 sm:px-12 sm:py-12">
    <div className="grid max-w-3xl gap-2 text-balance">
      <h2 className="font-semibold text-xl tracking-tight sm:text-2xl md:text-3xl lg:text-[40px]">
        {title}
      </h2>
      <p className="text-balance text-lg text-muted-foreground">
        {description}
      </p>
    </div>
    <div className="grid gap-8 md:grid-cols-3">
      {data.map((item) => (
        <a
          className="group flex-col overflow-hidden rounded-lg border bg-background p-4"
          href={item.link}
          key={item.title}
        >
          <h3 className="font-medium tracking-tight">{item.title}</h3>
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {item.description}
          </p>
          <Image
            alt={item.title}
            className={cn(
              "-rotate-3 -mb-12 mt-8 ml-7 aspect-video overflow-hidden rounded-md border object-cover object-top",
              "group-hover:-rotate-1 transition-transform duration-300 group-hover:scale-105"
            )}
            height={336}
            src={item.image}
            width={640}
          />
        </a>
      ))}
    </div>
  </div>
);
