import type {
  Cache,
  CustomHashes,
  FullConfiguration,
  PublicConfiguration,
  Revalidator,
  RevalidatorOptions,
  ScopedMutator
} from '../types'
import { initCache } from './cache'
import { slowConnection } from './env'
import { stableHash } from './hash'
import { isUndefined, mergeObjects, noop } from './shared'
import { preset } from './web-preset'

// error retry
const onErrorRetry = (
  _: unknown,
  __: string,
  config: Readonly<PublicConfiguration>,
  revalidate: Revalidator,
  opts: Required<RevalidatorOptions>
): void => {
  const maxRetryCount = config.errorRetryCount
  const currentRetryCount = opts.retryCount

  // Exponential backoff
  const timeout =
    ~~(
      (Math.random() + 0.5) *
      (1 << (currentRetryCount < 8 ? currentRetryCount : 8))
    ) * config.errorRetryInterval

  if (!isUndefined(maxRetryCount) && currentRetryCount > maxRetryCount) {
    return
  }

  setTimeout(revalidate, timeout, opts)
}

const compare = (currentData: any, newData: any, customHashes?: CustomHashes) =>
  stableHash(currentData, customHashes) == stableHash(newData, customHashes)
const customHashes = [] as CustomHashes

// Default cache provider
const [cache, mutate] = initCache(new Map()) as [Cache<any>, ScopedMutator]
export { cache, compare, mutate }

// Default config
export const defaultConfig: FullConfiguration = mergeObjects(
  {
    // events
    onLoadingSlow: noop,
    onSuccess: noop,
    onError: noop,
    onErrorRetry,
    onDiscarded: noop,

    // switches
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateIfStale: true,
    shouldRetryOnError: true,

    // timeouts
    errorRetryInterval: slowConnection ? 10000 : 5000,
    focusThrottleInterval: 5 * 1000,
    dedupingInterval: 2 * 1000,
    loadingTimeout: slowConnection ? 5000 : 3000,

    // providers
    compare,
    isPaused: () => false,
    cache,
    mutate,
    fallback: {},
    customHashes
  },
  // use web preset by default
  preset
)
