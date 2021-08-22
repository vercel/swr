// useSWR
import useSWR from './use-swr'
export default useSWR

// Core APIs
export { SWRConfig, mutate, unstable_serialize } from './use-swr'
export { useSWRProvider } from './utils/provider'

// Types
export {
  SWRConfiguration,
  Revalidator,
  RevalidatorOptions,
  Key,
  KeyLoader,
  SWRResponse,
  Cache,
  SWRHook,
  Fetcher,
  MutatorCallback,
  Middleware
} from './types'
