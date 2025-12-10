import { defineI18n } from "fumadocs-core/i18n";
import { defineI18nUI } from "fumadocs-ui/i18n";
import { translations } from "@/geistdocs";

export const i18n = defineI18n({
  defaultLanguage: "en",
  languages: Object.keys(translations),
  hideLocale: "default-locale",
});

export const { provider: i18nProvider } = defineI18nUI(i18n, {
  translations,
});
