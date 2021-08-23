import { FullConfiguration } from '../types'

export default function mergeConfig(
  a?: Partial<FullConfiguration>,
  b?: Partial<FullConfiguration>
) {
  // Need to create a new object to avoid mutating the original here.
  const v: Partial<FullConfiguration> = { ...a, ...b }

  const m1 = a && a.middlewares
  const m2 = b && b.middlewares
  if (m1 && m2) {
    v.middlewares = m1.concat(m2)
  }

  return v
}
