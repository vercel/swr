export * from './use-swr'
import { default as useSWR } from './use-swr'
export {
  useSWRInfinite,
  ExtendedConfigInterface,
  ExtendedResponseInterface
} from './use-swr-infinite'
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
