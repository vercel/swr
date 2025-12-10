import { SiVercel } from "@icons-pack/react-simple-icons";
import { DynamicLink } from "fumadocs-core/dynamic-link";
import { basePath, Logo, nav, suggestions } from "@/geistdocs";
import { Chat } from "./chat";
import { DesktopMenu } from "./desktop-menu";
import { SlashIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";
import { SearchButton } from "./search";

export const Navbar = () => (
  <header className="sticky top-0 z-40 w-full gap-6 border-b bg-sidebar">
    <div className="mx-auto flex h-16 w-full max-w-(--fd-layout-width) items-center gap-4 px-4 py-3.5 md:px-6">
      <div className="flex shrink-0 items-center gap-2.5">
        <a href="https://vercel.com/" rel="noopener" target="_blank">
          <SiVercel className="size-5" />
        </a>
        <SlashIcon className="size-5 text-border" />
        <DynamicLink href="/[lang]">
          <Logo />
        </DynamicLink>
      </div>
      <DesktopMenu className="hidden xl:flex" items={nav} />
      <div className="ml-auto flex flex-1 items-center justify-end gap-2">
        <SearchButton className="hidden xl:flex" />
        <Chat basePath={basePath} suggestions={suggestions} />
        <MobileMenu />
      </div>
    </div>
  </header>
);
