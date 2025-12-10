"use client";

import { useI18n } from "fumadocs-ui/contexts/i18n";
import { CheckIcon, LanguagesIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const LanguageSelector = () => {
  const { locale, locales, onChange } = useI18n();

  if (!locales) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select language"
        className="flex items-center justify-center rounded-md p-2 hover:bg-muted"
      >
        <LanguagesIcon className="size-4.5" />
        <span className="sr-only">Select language</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((lang) => (
          <DropdownMenuItem
            className="flex cursor-pointer items-center justify-between"
            disabled={locale === lang.locale}
            key={lang.locale}
            onClick={() => onChange?.(lang.locale)}
          >
            {lang.name}
            {locale === lang.locale && <CheckIcon className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
