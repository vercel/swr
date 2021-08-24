import { dequal } from 'dequal/lite'

import { initCache } from './cache'
import { preset } from './web-preset'
import { slowConnection } from './env'
import {
  PublicConfiguration,
  FullConfiguration,
  RevalidatorOptions,
  Revalidator,
  ScopedMutator,
  Cache
} from '../types'
import { isUndefined, noop, mergeObjects } from './helper'

// error retry
function onErrorRetry(
  _: unknown,
  __: string,
  config: Readonly<PublicConfiguration>,
  revalidate: Revalidator,
  opts: Required<RevalidatorOptions>
): void {
  if (!preset.isVisible()) {
    // If it's hidden, stop. It will auto revalidate when refocusing.
    return
  }

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

// Default cache provider
const [cache, mutate] = initCache(new Map()) as [Cache<any>, ScopedMutator<any>]
export { cache, mutate }

// Default config
export const defaultConfig: FullConfiguration = mergeObjects(
  {
    // events
    onLoadingSlow: noop,
    onSuccess: noop,
    onError: noop,
    onErrorRetry,

    // switches
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    revalidateWhenStale: true,
    shouldRetryOnError: true,

    // timeouts
    errorRetryInterval: slowConnection ? 10000 : 5000,
    focusThrottleInterval: 5 * 1000,
    dedupingInterval: 2 * 1000,
    loadingTimeout: slowConnection ? 5000 : 3000,

    // providers
    compare: dequal,
    isPaused: () => false,
    cache,
    mutate,
    fallback: {}
  },
  // use web preset by default
  preset
)
