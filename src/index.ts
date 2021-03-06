// `useSWR` and related APIs
import { default as useSWR } from './use-swr'
export default useSWR
export * from './use-swr'

// `useSWRInfinite`
export {
  useSWRInfinite,
  SWRInfiniteConfigInterface,
  SWRInfiniteResponseInterface
} from './use-swr-infinite'

// Cache related, to be replaced by the new APIs
export { cache } from './config'

// Types
export {
  // Legacy
  ConfigInterface,
  // Latest
  SWRConfiguration,
  revalidateType,
  RevalidateOptionInterface,
  keyInterface,
  responseInterface,
  CacheInterface
} from './types'
