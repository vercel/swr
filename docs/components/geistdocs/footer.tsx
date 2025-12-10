import { SiVercel } from "@icons-pack/react-simple-icons";
import { GitHubButton } from "./github-button";
import { LanguageSelector } from "./language-selector";
import { RSSButton } from "./rss-button";
import { ThemeToggle } from "./theme-toggle";

type FooterProps = {
  copyright?: string;
};

export const Footer = ({
  copyright = `Copyright Vercel ${new Date().getFullYear()}. All rights reserved.`,
}: FooterProps) => (
  <footer className="border-t px-4 py-5 md:px-6">
    <div className="mx-auto flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <SiVercel className="size-4" />
        <p className="text-center text-muted-foreground text-sm">{copyright}</p>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSelector />
        <RSSButton />
        <GitHubButton />
        <ThemeToggle />
      </div>
    </div>
  </footer>
);
