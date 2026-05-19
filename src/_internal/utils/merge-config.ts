import { mergeObjects } from './shared'
import type { FullConfiguration } from '../types'

export const mergeConfigs = (
  a: Partial<FullConfiguration>,
  b?: Partial<FullConfiguration>
) => {
  // Need to create a new object to avoid mutating the original here.
  // Skip keys whose value is `undefined` in `b` so that explicitly passing
  // `undefined` (e.g. `onSuccess: undefined`) behaves like omitting the key
  // and does not overwrite inherited defaults.
  const v: Partial<FullConfiguration> = { ...a }
  if (b) {
    for (const k in b) {
      if (b[k as keyof FullConfiguration] !== undefined) {
        ;(v as any)[k] = b[k as keyof FullConfiguration]
      }
    }
  }

  // If two configs are provided, merge their `use` and `fallback` options.
  if (b) {
    const { use: u1, fallback: f1 } = a
    const { use: u2, fallback: f2 } = b
    if (u1 && u2) {
      v.use = u1.concat(u2)
    }
    if (f1 && f2) {
      v.fallback = mergeObjects(f1, f2)
    }
  }

  return v
}
