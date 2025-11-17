import { SiVercel } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import type { ReactNode } from "react";
import { Chat } from "./chat";
import { DesktopMenu } from "./desktop-menu";
import { GitHubButton } from "./github-button";
import { SlashIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";
import { RSSButton } from "./rss-button";
import { SearchButton } from "./search";
import { ThemeToggle } from "./theme-toggle";

type NavbarProps = {
  children: ReactNode;
  items: {
    label: string;
    href: string;
  }[];
  suggestions: string[];
};

export const Navbar = ({ children, items, suggestions }: NavbarProps) => (
  <header className="sticky top-0 z-40 h-16 w-full gap-6 border-b bg-sidebar">
    <div className="mx-auto flex w-full max-w-(--fd-layout-width) items-center gap-4 px-4 py-3.5 md:px-6">
      <div className="flex shrink-0 items-center gap-2.5">
        <a href="https://vercel.com/" rel="noopener" target="_blank">
          <SiVercel className="size-5" />
        </a>
        <SlashIcon className="size-5 text-border" />
        <Link href="/">{children}</Link>
      </div>
      <div className="hidden flex-1 md:block">
        <DesktopMenu items={items} />
      </div>
      <div className="hidden flex-1 shrink-0 items-center justify-end gap-1 md:flex">
        <RSSButton />
        <GitHubButton />
        <ThemeToggle />
        <SearchButton />
        <Chat suggestions={suggestions} />
      </div>
      <div className="ml-auto flex items-center gap-1 md:hidden">
        <SearchButton />
        <MobileMenu />
      </div>
    </div>
  </header>
);
