import { RssIcon } from "lucide-react";
import { Button } from "../ui/button";

export const RSSButton = () => (
  <Button asChild size="icon-sm" type="button" variant="ghost">
    <a href="/rss.xml" rel="noopener" target="_blank">
      <RssIcon className="size-4" />
    </a>
  </Button>
);
