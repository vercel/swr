"use client";

import { MessageCircleIcon } from "lucide-react";
import { useChatContext } from "@/hooks/geistdocs/use-chat";

type AskAIProps = {
  href: string;
};

export const AskAI = ({ href }: AskAIProps) => {
  const { setIsOpen, setPrompt } = useChatContext();

  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const url = new URL(
    href,
    `${protocol}://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
  ).toString();
  const query = `Read this page, I want to ask questions about it. ${url}`;

  return (
    <button
      className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      onClick={() => {
        setPrompt(query);
        setIsOpen(true);
      }}
      type="button"
    >
      <MessageCircleIcon className="size-3.5" />
      <span>Ask AI about this page</span>
    </button>
  );
};
