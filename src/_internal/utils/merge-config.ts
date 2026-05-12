import { mergeObjects } from './shared'
import type { FullConfiguration } from '../types'

// Strip keys with `undefined` values from an object so they don't override
// defaults when spread-merged. This prevents issues like passing
// `{ onSuccess: undefined }` from overriding the default `noop` callback.
const stripUndefinedValues = (obj: Partial<FullConfiguration>) => {
  const result: Partial<FullConfiguration> = {}
  for (const key in obj) {
    if (obj[key as keyof FullConfiguration] !== undefined) {
      ;(result as any)[key] = obj[key as keyof FullConfiguration]
    }
  }
  return result
}

export const mergeConfigs = (
  a: Partial<FullConfiguration>,
  b?: Partial<FullConfiguration>
) => {
  // Need to create a new object to avoid mutating the original here.
  // Strip undefined values from `b` so they don't override defaults from `a`.
  const v: Partial<FullConfiguration> = mergeObjects(
    a,
    b ? stripUndefinedValues(b) : b
  )

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
