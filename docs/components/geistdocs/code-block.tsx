"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CodeBlockProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  style?: CSSProperties;
  tabIndex?: number;
  title?: string;
};

export const CodeBlock = ({
  children,
  className,
  icon,
  style,
  tabIndex,
  title,
}: CodeBlockProps) => {
  const ref = useRef<HTMLPreElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    if (typeof window === "undefined" || !navigator?.clipboard?.writeText) {
      toast.error("Clipboard API not available");
      return;
    }

    const code = ref.current?.innerText;

    if (!code) {
      toast.error("No code to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      toast.error(message);
    }
  }, []);

  const Icon = isCopied ? CheckIcon : CopyIcon;

  const CodeBlockComponent = useCallback(
    (props: { className?: string }) => (
      <pre
        className={cn(
          "not-prose flex-1 overflow-x-auto rounded-sm border bg-background py-3 text-sm outline-none",
          "[&>code]:grid",
          className,
          props.className
        )}
        ref={ref}
        style={style}
        tabIndex={tabIndex}
      >
        {children}
      </pre>
    ),
    [children, style, tabIndex, className]
  );

  if (!title) {
    return (
      <div className="relative mb-6">
        <CodeBlockComponent />
        <Button
          className={cn(
            "absolute top-[5px] right-[5px] bg-background/80 backdrop-blur-sm",
            className
          )}
          onClick={copyToClipboard}
          size="icon"
          variant="ghost"
        >
          <Icon size={14} />
        </Button>
      </div>
    );
  }

  return (
    <Card className="not-prose mb-6 gap-0 overflow-hidden rounded-sm p-0 shadow-none">
      <CardHeader className="flex items-center gap-2 border-b bg-sidebar py-1.5! pr-1.5 pl-4 text-muted-foreground">
        <div
          className="size-3.5 shrink-0"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: "Required for icon prop."
          dangerouslySetInnerHTML={{ __html: icon as unknown as TrustedHTML }}
        />
        <CardTitle className="flex-1 font-mono font-normal text-sm tracking-tight">
          {title}
        </CardTitle>
        <Button
          className={cn("shrink-0", className)}
          onClick={copyToClipboard}
          size="icon"
          variant="ghost"
        >
          <Icon size={14} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <CodeBlockComponent className="line-numbers rounded-none border-none" />
      </CardContent>
    </Card>
  );
};
