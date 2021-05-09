// `useSWR` and related APIs
import { default as useSWR } from './use-swr'
export { SWRConfig, mutate, createCache } from './use-swr'
export default useSWR

// `useSWRInfinite`
export { default as useSWRInfinite } from './use-swr-infinite'

// Types
export {
  SWRConfiguration,
  SWRInfiniteConfiguration,
  SWRInfiniteResponse,
  Revalidator,
  RevalidatorOptions,
  Key,
  KeyLoader,
  SWRResponse,
  Cache,
  Middleware,
  // Legacy, for backwards compatibility
  ConfigInterface,
  SWRInfiniteConfigInterface,
  SWRInfiniteResponseInterface,
  revalidateType,
  RevalidateOptionInterface,
  keyInterface,
  responseInterface
} from './types'
