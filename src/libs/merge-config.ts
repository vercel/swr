import { Configuration } from '../types'

export default function mergeConfig(
  a: Partial<Configuration> | null,
  b: Partial<Configuration> | null
) {
  const v: Partial<Configuration> = { ...a, ...b }

  const m1 = a && a.middlewares
  const m2 = b && b.middlewares
  if (m1 && m2) {
    v.middlewares = m1.concat(m2)
  }

  return v
}
