import { Cache } from './types'

export function wrapCache<Data = any>(provider: Cache<Data>): Cache {
  // We might want to inject an extra layer on top of `provider` in the future,
  // such as key serialization, auto GC, etc.
  // For now, it's just a `Map` interface without any modifications.
  return provider
}
