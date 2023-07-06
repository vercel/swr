import 'client-only'

// useSWR
import useSWR from './use-swr'
export default useSWR
// Core APIs
export { SWRConfig, unstable_serialize } from './use-swr'
export { useSWRConfig } from 'swr/_internal'
export { mutate } from 'swr/_internal'
export { preload } from 'swr/_internal'

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
  BareFetcher,
  Fetcher,
  MutatorCallback,
  MutatorOptions,
  Middleware,
  Arguments,
  State
} from 'swr/_internal'
