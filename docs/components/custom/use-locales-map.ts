import { useRouter } from 'next/router'

type DefaultLocale = 'en-US'
type Locale =
  | DefaultLocale
  | 'zh-CN'
  | 'es-ES'
  | 'fr-FR'
  | 'pt-BR'
  | 'ja'
  | 'ko'
  | 'ru'

export default function useLocalesMap<T>(localesMap: Record<Locale, T>): T {
  const router = useRouter()
  const { locale, defaultLocale } = router

  if (!localesMap) {
    throw new Error('Pass a locales map as argument to useLocalesMap')
  }

  if (!isObject(localesMap)) {
    throw new Error('Locales map must be an object')
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      localesMap,
      defaultLocale as PropertyKey
    )
  ) {
    throw new Error(
      `Locales map must contain default locale "${defaultLocale}"`
    )
  }

  if (
    Object.prototype.hasOwnProperty.call(localesMap, locale as PropertyKey) &&
    typeof localesMap[locale as Locale] !==
      typeof localesMap[defaultLocale as DefaultLocale]
  ) {
    throw new Error(
      `Invalid locales map: Shape of "${locale}" must be the same as "${defaultLocale}"`
    )
  }

  if (
    ['string', 'number', 'symbol'].includes(
      typeof localesMap[defaultLocale as DefaultLocale]
    )
  ) {
    return (
      localesMap[locale as Locale] || localesMap[defaultLocale as DefaultLocale]
    )
  }

  const target = JSON.parse(
    JSON.stringify(localesMap[defaultLocale as DefaultLocale])
  )
  return mergeDeep(target, localesMap[locale as Locale])
}

/**
 * Simple object check.
 */
function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Deep merge two objects.
 */
function mergeDeep<T>(
  target: Record<string, T>,
  ...sources: (Record<string, T> | undefined)[]
): Record<string, T> {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(
          target[key] as Record<string, T>,
          source[key] as Record<string, T>
        )
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeep(target, ...sources)
}
