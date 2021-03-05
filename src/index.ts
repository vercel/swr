export * from './use-swr'
import { default as useSWR } from './use-swr'
export {
  useSWRInfinite,
  SWRInfiniteConfigInterface,
  SWRInfiniteResponseInterface
} from './use-swr-infinite'
export { cache } from './config'
export {
  ConfigInterface,
  revalidateType,
  RevalidateOptionInterface,
  keyInterface,
  ResponseInterface as responseInterface,
  CacheInterface
} from './types'
export default useSWR
