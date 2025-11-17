import { SiGithub } from "@icons-pack/react-simple-icons";
import { Button } from "../ui/button";

export const GitHubButton = () => {
  const owner = process.env.NEXT_PUBLIC_GEISTDOCS_OWNER;
  const repo = process.env.NEXT_PUBLIC_GEISTDOCS_REPO;

  if (!(owner && repo)) {
    return null;
  }

  const url = `https://github.com/${owner}/${repo}`;

  return (
    <Button asChild size="icon-sm" type="button" variant="ghost">
      <a href={url} rel="noopener" target="_blank">
        <SiGithub className="size-4" />
      </a>
    </Button>
  );
};
