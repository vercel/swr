import { isToolUIPart } from "ai";
import { BookmarkIcon } from "lucide-react";
import type { MyUIMessage } from "@/app/api/chat/types";
import { Shimmer } from "../ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "../ai-elements/sources";
import { Spinner } from "../ui/spinner";

type MessageMetadataProps = {
  parts: MyUIMessage["parts"];
  inProgress: boolean;
};

export const MessageMetadata = ({
  parts,
  inProgress,
}: MessageMetadataProps) => {
  // Pull out last part that is either text or tool call
  const lastPart = parts
    .filter((part) => part.type === "text" || isToolUIPart(part))
    .at(-1);

  const reasoning = parts.at(-1)?.type === "reasoning";

  if (!lastPart) {
    return (
      <div className="flex items-center gap-2">
        <Spinner />{" "}
        {reasoning ? <Shimmer className="text-xs">Thinking...</Shimmer> : ""}
      </div>
    );
  }

  const tool = isToolUIPart(lastPart) ? lastPart : null;

  const sources = Array.from(
    new Map(
      parts
        .filter((part) => part.type === "source-url")
        .map((part) => [part.url, part])
    ).values()
  );

  if (sources.length > 0 && !(tool && inProgress)) {
    return (
      <Sources>
        <SourcesTrigger count={sources.length}>
          <BookmarkIcon className="size-4" />
          <p>Used {sources.length} sources</p>
        </SourcesTrigger>
        <SourcesContent>
          <ul className="flex flex-col gap-2">
            {sources.map((source) => (
              <li className="ml-4.5 list-disc pl-1" key={source.url}>
                <Source href={source.url} title={source.url}>
                  {source.title}
                </Source>
              </li>
            ))}
          </ul>
        </SourcesContent>
      </Sources>
    );
  }

  if (tool && inProgress) {
    return (
      <div className="flex items-center gap-2">
        <Spinner />
        <Shimmer>{tool.type}</Shimmer>
      </div>
    );
  }

  if (!tool && sources.length === 0) {
    return null;
  }

  return <div className="h-12" />;
};
