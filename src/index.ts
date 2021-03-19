// `useSWR` and related APIs
import { default as useSWR } from './use-swr'
export default useSWR
export * from './use-swr'
import { cache } from './config'

// `useSWRInfinite`
export { useSWRInfinite } from './use-swr-infinite'

export { cache }

// Custom cache
export { createProvider } from './cache'

// Types
export {
  SWRConfiguration,
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  Revalidator,
  RevalidatorOptions,
  Key,
  SWRResponse,
  Cache,
  // Legacy, for backwards compatibility
  ConfigInterface,
  SWRInfiniteConfigInterface,
  SWRInfiniteResponseInterface,
  revalidateType,
  RevalidateOptionInterface,
  keyInterface,
  responseInterface,
  CacheInterface
} from './types'
