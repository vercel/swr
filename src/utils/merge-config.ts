import { FullConfiguration } from '../types'

export default function mergeConfig(
  a: Partial<FullConfiguration>,
  b?: Partial<FullConfiguration>
) {
  // Need to create a new object to avoid mutating the original here.
  const v: Partial<FullConfiguration> = { ...a, ...b }

  if (!b) return v

  const { middlewares: m1, fallbackValues: f1 } = a
  const { middlewares: m2, fallbackValues: f2 } = b
  if (m1 && m2) {
    v.middlewares = m1.concat(m2)
  }
  if (f1 && f2) {
    v.fallbackValues = { ...f1, ...f2 }
  }

  return v
}
