import { mergeObjects } from './shared'
import type { FullConfiguration } from '../types'

export const mergeConfigs = (
  a: Partial<FullConfiguration>,
  b?: Partial<FullConfiguration>
) => {
  // Need to create a new object to avoid mutating the original here.
  const v: Partial<FullConfiguration> = mergeObjects(a, b)

  // If two configs are provided, merge their `use`, `fallback`, and
  // `unstable_preload` options.
  if (b) {
    const { use: u1, fallback: f1, unstable_preload: p1 } = a
    const { use: u2, fallback: f2, unstable_preload: p2 } = b
    if (u1 && u2) {
      v.use = u1.concat(u2)
    }
    if (f1 && f2) {
      v.fallback = mergeObjects(f1, f2)
    }
    if (p1 && p2) {
      v.unstable_preload = p1.concat(p2)
    }
  }

  return v
}
