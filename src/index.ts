// `useSWR` and related APIs
import { default as useSWR } from './use-swr'
export default useSWR
export * from './use-swr'

// `useSWRInfinite`
export { useSWRInfinite } from './use-swr-infinite'

// Cache related, to be replaced by the new APIs
export { cache } from './config'

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
