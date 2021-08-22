// Core APIs
export {
  SWRConfig,
  mutate,
  useSWRProvider,
  unstable_serialize
} from './use-swr'

// useSWR
import useSWR from './use-swr'
export default useSWR

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
