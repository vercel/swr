// useSWR
import useSWR from './use-swr'
export default useSWR
// Core APIs
export { SWRConfig } from './use-swr'
export { unstable_serialize } from './serialize'
export { useSWRConfig } from '../_internal'
export { mutate } from '../_internal'
export { preload } from '../_internal'

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
} from '../_internal'
