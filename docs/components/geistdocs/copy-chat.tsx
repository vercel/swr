import type { UIMessage } from "ai";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const CopyChat = ({ messages }: { messages: UIMessage[] }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyChat = async () => {
    const markdown = messages
      .map((message) => {
        const role = message.role === "user" ? "You" : "AI";
        const content = message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");
        return `**${role}:**\n${content}`;
      })
      .join("\n\n---\n\n");

    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Chat copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy chat", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          disabled={messages.length === 0}
          onClick={handleCopyChat}
          size="icon-sm"
          variant="ghost"
        >
          <Icon className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Copy chat</TooltipContent>
    </Tooltip>
  );
};
