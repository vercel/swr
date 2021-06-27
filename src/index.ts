// Core APIs
export { SWRConfig, mutate, createCache } from './use-swr'

// useSWR
export { default as useSWR } from './use-swr'

// useSWRInfinite
export { default as useSWRInfinite } from './use-swr-infinite'

// useSWRImmutable
export { default as useSWRImmutable } from './use-swr-immutable'

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
