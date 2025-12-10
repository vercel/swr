"use client";

import { SiMarkdown } from "@icons-pack/react-simple-icons";
import { ThumbsUpIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  type FormEventHandler,
  useEffect,
  useState,
  useTransition,
} from "react";
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

export const Feedback = () => {
  const url = usePathname();
  const [submitted, setSubmitted] = useState(false);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const item = localStorage.getItem(`docs-feedback-${url}`);

    if (!item) {
      return;
    }

    setSubmitted(true);
  }, [url]);

  const submit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();

    if (!emotion) {
      return;
    }

    startTransition(() => {
      const feedback: Feedback = {
        emotion,
        message,
      };

      sendFeedback(url, feedback).then(() => {
        setSubmitted(true);
        setMessage("");
        setEmotion(null);
      });
    });

    e?.preventDefault();
  };

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
          {submitted ? (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-sidebar px-3 py-6 text-center text-sm">
              <p>Thank you for your feedback!</p>
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
                      e.currentTarget.form?.requestSubmit();
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
                        emotion === e.name ? "bg-accent text-foreground" : ""
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
                  disabled={isPending || !emotion || !message}
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
