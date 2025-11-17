"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { CheckIcon, CopyIcon } from "lucide-react";

type CopyPageProps = {
  text: string;
};

export const CopyPage = ({ text }: CopyPageProps) => {
  const [checked, handleCopy] = useCopyButton(async () => {
    await navigator.clipboard.writeText(text);
  });

  const Icon = checked ? CheckIcon : CopyIcon;

  return (
    <button
      className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
      onClick={handleCopy}
      type="button"
    >
      <Icon className="size-3.5" />
      <span>Copy page</span>
    </button>
  );
};
