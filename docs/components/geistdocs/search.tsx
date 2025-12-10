"use client";

import { useDocsSearch } from "fumadocs-core/search/client";
import {
  SearchDialog as FumadocsSearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SharedProps,
} from "fumadocs-ui/components/dialog/search";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Kbd } from "../ui/kbd";

type SearchButtonProps = {
  className?: string;
  onClick?: () => void;
};

export const SearchDialog = ({
  basePath,
  ...props
}: SharedProps & { basePath: string | undefined }) => {
  const { locale } = useI18n();
  const { search, setSearch, query } = useDocsSearch({
    type: "fetch",
    locale,
    api: basePath ? `${basePath}/api/search` : "/api/search",
  });

  return (
    <FumadocsSearchDialog
      isLoading={query.isLoading}
      onSearchChange={setSearch}
      search={search}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <SearchDialogList items={query.data !== "empty" ? query.data : null} />
      </SearchDialogContent>
    </FumadocsSearchDialog>
  );
};

export const SearchButton = ({ className, onClick }: SearchButtonProps) => {
  const { setOpenSearch } = useSearchContext();

  return (
    <Button
      className={cn(
        "justify-between gap-8 pr-1.5 font-normal text-muted-foreground shadow-none",
        className
      )}
      onClick={() => {
        setOpenSearch(true);
        onClick?.();
      }}
      size="sm"
      type="button"
      variant="outline"
    >
      <span>Search...</span>
      <Kbd className="border bg-background font-medium">⌘K</Kbd>
    </Button>
  );
};
