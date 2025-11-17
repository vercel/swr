"use client";

import { SiGithub, SiMarkdown } from "@icons-pack/react-simple-icons";
import { ThumbsUpIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { type SyntheticEvent, useEffect, useState, useTransition } from "react";
import { sendFeedback } from "@/app/actions/feedback";
import { emotions } from "@/app/actions/feedback/emotions";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";

type Emotion = (typeof emotions)[number]["name"];

export type Feedback = {
  emotion: Emotion;
  url?: string;
  message: string;
};

export type ActionResponse = {
  githubUrl: string;
};

interface Result extends Feedback {
  response?: ActionResponse;
}

export const Feedback = () => {
  const url = usePathname();
  const [previous, setPrevious] = useState<Result | null>(null);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const item = localStorage.getItem(`docs-feedback-${url}`);

    if (item === null) {
      return;
    }

    setPrevious(JSON.parse(item) as Result);
  }, [url]);

  useEffect(() => {
    const key = `docs-feedback-${url}`;

    if (previous) {
      localStorage.setItem(key, JSON.stringify(previous));
    } else {
      localStorage.removeItem(key);
    }
  }, [previous, url]);

  const submit = (e?: SyntheticEvent) => {
    if (emotion == null) {
      return;
    }

    startTransition(() => {
      const feedback: Feedback = {
        emotion,
        message,
      };

      sendFeedback(url, feedback).then((response) => {
        setPrevious({
          response,
          ...feedback,
        });
        setMessage("");
        setEmotion(null);
      });
    });

    e?.preventDefault();
  };

  const activeEmotion = previous?.emotion ?? emotion;

  if (
    !(
      process.env.NEXT_PUBLIC_GEISTDOCS_REPO &&
      process.env.NEXT_PUBLIC_GEISTDOCS_OWNER &&
      process.env.NEXT_PUBLIC_GEISTDOCS_CATEGORY
    )
  ) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
          type="button"
        >
          <ThumbsUpIcon className="size-3.5" />
          <span>Give feedback</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="overflow-hidden p-0">
        <div className="overflow-visible">
          {previous ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-sidebar px-3 py-6 text-center text-sm">
              <p>Thank you for your feedback!</p>
              <div className="flex flex-row items-center gap-2">
                <Button asChild size="sm">
                  <a
                    href={previous.response?.githubUrl}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    <SiGithub className="size-4" fill="currentColor" />
                    View on GitHub
                  </a>
                </Button>

                <Button
                  onClick={() => {
                    setEmotion(previous.emotion);
                    setPrevious(null);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Submit Again
                </Button>
              </div>
            </div>
          ) : (
            <form className="flex flex-col" onSubmit={submit}>
              <div className="p-2">
                <Textarea
                  autoFocus
                  className="max-h-48 min-h-24 shadow-none"
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (!e.shiftKey && e.key === "Enter") {
                      submit(e);
                    }
                  }}
                  placeholder="Leave your feedback..."
                  required
                  value={message}
                />
              </div>
              <div className="flex items-center justify-end gap-1 px-2 text-muted-foreground">
                <SiMarkdown className="inline size-3" />
                <p className="text-xs"> supported</p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t bg-sidebar p-2">
                <div className="flex items-center gap-px">
                  {emotions.map((e) => (
                    <Button
                      className={cn(
                        "text-muted-foreground hover:text-foreground",
                        activeEmotion === e.name && "bg-accent text-foreground"
                      )}
                      key={e.name}
                      onClick={() => setEmotion(e.name)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {e.emoji}
                      <span className="sr-only">{e.name}</span>
                    </Button>
                  ))}
                </div>
                <Button
                  disabled={isPending}
                  size="sm"
                  type="submit"
                  variant="default"
                >
                  Send
                </Button>
              </div>
            </form>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
