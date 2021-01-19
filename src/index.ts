export * from './use-swr'
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
  responseInterface,
  CacheInterface
} from './types'

// A work around for the `__esModule` mark as microbundle
// doesn't support mixed exports currently.
// https://github.com/developit/microbundle/issues/306#issuecomment-459103476
import * as exports from './use-swr'
Object.defineProperty(exports, '__esModule', { value: true })
export default exports
