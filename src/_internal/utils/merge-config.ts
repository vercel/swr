import { mergeObjects } from './shared'
import type { FullConfiguration } from '../types'

export const mergeConfigs = (
  a: Partial<FullConfiguration>,
  b?: Partial<FullConfiguration>
) => {
  // Need to create a new object to avoid mutating the original here.
  const v: Partial<FullConfiguration> = mergeObjects(a, b)

  // If two configs are provided, merge their `use`, `fallback`, and
  // `cacheData` options.
  if (b) {
    const { use: u1, fallback: f1, cacheData: c1 } = a
    const { use: u2, fallback: f2, cacheData: c2 } = b
    if (u1 && u2) {
      v.use = u1.concat(u2)
    }
    if (f1 && f2) {
      v.fallback = mergeObjects(f1, f2)
    }
    if (c1 && c2) {
      v.cacheData = mergeObjects(c1, c2)
    }
  }

  return v
}
