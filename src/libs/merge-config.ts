import { Configuration } from '../types'

export default function mergeConfig(
  a: Partial<Configuration>,
  b: Partial<Configuration>
) {
  const v = { ...a, ...b }

  const m1 = a.middlewares
  const m2 = b.middlewares
  if (m1 && m2) {
    v.middlewares = m1.concat(m2)
  }

  return v
}
