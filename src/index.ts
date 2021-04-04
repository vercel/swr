// `useSWR` and related APIs
import { default as useSWR } from './use-swr'
export default useSWR
export * from './use-swr'

// `useSWRInfinite`
export { useSWRInfinite } from './use-swr-infinite'

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
  // Legacy, for backwards compatibility
  ConfigInterface,
  SWRInfiniteConfigInterface,
  SWRInfiniteResponseInterface,
  revalidateType,
  RevalidateOptionInterface,
  keyInterface,
  responseInterface
} from './types'
