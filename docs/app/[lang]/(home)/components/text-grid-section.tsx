type TextGridSectionProps = {
  data: {
    id: string;
    title: string;
    description: string;
  }[];
};

export const TextGridSection = ({ data }: TextGridSectionProps) => (
  <div className="grid gap-8 px-4 py-8 sm:px-12 sm:py-12 md:grid-cols-3">
    {data.map((item) => (
      <div key={item.id}>
        <h3 className="mb-2 font-semibold text-lg tracking-tight">
          {item.title}
        </h3>
        <p className="text-muted-foreground">{item.description}</p>
      </div>
    ))}
  </div>
);
