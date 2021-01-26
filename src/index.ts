export * from './use-swr'
import { default as useSWR } from './use-swr'
export {
  useSWRInfinite,
  SWRInfiniteConfigInterface,
  SWRInfiniteResponseInterface
} from './use-swr-infinite'
export {
  useSWRSubscription,
  SWRSubscription,
  SWRSubscriptionResponse
} from './use-swr-subscription'
export { cache } from './config'
export {
  ConfigInterface,
  revalidateType,
  RevalidateOptionInterface,
  keyInterface,
  responseInterface,
  CacheInterface
} from './types'
export default useSWR
