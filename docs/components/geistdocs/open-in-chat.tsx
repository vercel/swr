import { ExternalLinkIcon } from "lucide-react";
import {
  OpenIn,
  OpenInChatGPT,
  OpenInClaude,
  OpenInContent,
  OpenInCursor,
  OpenInScira,
  OpenInSeparator,
  OpenInT3,
  OpenInTrigger,
  OpenInv0,
} from "@/components/ai-elements/open-in-chat";

type OpenInChatProps = {
  href: string;
};

export const OpenInChat = ({ href }: OpenInChatProps) => {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const url = new URL(
    href,
    `${protocol}://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  ).toString();
  const query = `Read this page, I want to ask questions about it. ${url}`;

  return (
    <OpenIn query={query}>
      <OpenInTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
          type="button"
        >
          <ExternalLinkIcon className="size-4" />
          Open in chat
        </button>
      </OpenInTrigger>
      <OpenInContent align="start" side="top">
        <OpenInv0 />
        <OpenInSeparator />
        <OpenInChatGPT />
        <OpenInClaude />
        <OpenInT3 />
        <OpenInScira />
        <OpenInCursor />
      </OpenInContent>
    </OpenIn>
  );
};
