import { SiGithub } from "@icons-pack/react-simple-icons";
import { github } from "@/geistdocs";

type EditSourceProps = {
  path: string | undefined;
};

export const EditSource = ({ path }: EditSourceProps) => {
  let url: string | undefined;

  if (github.owner && github.repo && path) {
    url = `https://github.com/${github.owner}/${github.repo}/edit/main/docs/content/docs/${path}`;
  }

  if (!url) {
    return null;
  }

  return (
    <a
      className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <SiGithub className="size-3.5" />
      <span>Edit this page on GitHub</span>
    </a>
  );
};
