import { mergeObjects } from './helper'
import { FullConfiguration } from '../types'

export function mergeConfigs(
  a: Partial<FullConfiguration>,
  b?: Partial<FullConfiguration>
) {
  // Need to create a new object to avoid mutating the original here.
  const v: Partial<FullConfiguration> = mergeObjects(a, b)

  if (!b) return v

  const { use: u1, fallback: f1 } = a
  const { use: u2, fallback: f2 } = b
  if (u1 && u2) {
    v.use = u1.concat(u2)
  }
  if (f1 && f2) {
    v.fallback = mergeObjects(f1, f2)
  }

  return v
}
