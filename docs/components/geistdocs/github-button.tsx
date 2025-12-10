import { SiGithub } from "@icons-pack/react-simple-icons";
import { github } from "@/geistdocs";
import { Button } from "../ui/button";

export const GitHubButton = () => {
  if (!(github.owner && github.repo)) {
    return null;
  }

  const url = `https://github.com/${github.owner}/${github.repo}`;

  return (
    <Button asChild size="icon-sm" type="button" variant="ghost">
      <a href={url} rel="noopener" target="_blank">
        <SiGithub className="size-4" />
      </a>
    </Button>
  );
};
