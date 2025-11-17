import { useRouter } from "next/router";

/**
 * @typedef {"en-US"} DefaultLocale
 * @typedef {DefaultLocale | "zh-CN" | "es-ES" | "fr-FR" | "pt-BR" | "ja" | "ko" | "ru"} Locale
 * @typedef {{locale?: Locale | undefined; locales?: Locale[] | undefined; defaultLocale?: DefaultLocale | undefined}} TypedRouter
 * @typedef {Omit<import('next/router').NextRouter, "locale" | "locales" | "defaultLocale"> & TypedRouter} NextRouter
 * @template T
 * @type {(localesMap: Record<Locale, T>) => T}
 */
export default function useLocalesMap(localesMap) {
  /** @type {NextRouter} */
  const router = useRouter();
  const { locale, defaultLocale } = router;
  if (!localesMap) {
    throw new Error("Pass a locales map as argument to useLocalesMap");
  }

  if (!isObject(localesMap)) {
    throw new Error("Locales map must be an object");
  }

  if (!localesMap.hasOwnProperty(defaultLocale)) {
    throw new Error(
      `Locales map must contain default locale "${defaultLocale}"`
    );
  }

  if (
    localesMap.hasOwnProperty(locale) &&
    typeof localesMap[locale] !== typeof localesMap[defaultLocale]
  ) {
    throw new Error(
      `Invalid locales map: Shape of "${locale}" must be the same as "${defaultLocale}"`
    );
  }

  if (["string", "number", "symbol"].includes(typeof localesMap[defaultLocale])) {
    return localesMap[locale] || localesMap[defaultLocale];
  }

  const target = JSON.parse(JSON.stringify(localesMap[defaultLocale]));
  return mergeDeep(target, localesMap[locale]);
}

/**
 * Simple object check.
 * @param {any} item
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @template T
 * @param {Record<string, T>} target
 * @param {Record<string, T>} sources
 * @returns {Record<string, T>}
 */
function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
