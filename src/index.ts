export * from './use-swr'
import { default as useSWR } from './use-swr'
export { useSWRPages } from './use-swr-pages'
export {
  ConfigInterface,
  revalidateType,
  RevalidateOptionInterface,
  keyInterface,
  responseInterface,
  CacheInterface
} from './types'
export { default as Cache } from './cache'
export default useSWR
