// useSWR
import useSWR from './use-swr'
export default useSWR

// Core APIs
export { SWRConfig, unstable_serialize } from './use-swr'
export { mutate, useSWRConfig } from './utils'

// Types
export type {
  SWRConfiguration,
  Revalidator,
  RevalidatorOptions,
  Key,
  KeyLoader,
  KeyedMutator,
  SWRHook,
  SWRResponse,
  Cache,
  CacheValue,
  BareFetcher,
  Fetcher,
  MutatorCallback,
  MutatorOptions,
  Middleware,
  Arguments
} from 'swr/_internal'
