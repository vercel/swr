import { dequal } from 'dequal/lite'

import { wrapCache } from './cache'
import { preset } from './web-preset'
import { slowConnection } from './env'
import { Configuration, RevalidatorOptions, Revalidator } from '../types'
import { UNDEFINED } from './helper'

const fetcher = (url: string) => fetch(url).then(res => res.json())
const noop = () => {}

// error retry
function onErrorRetry(
  _: unknown,
  __: string,
  config: Readonly<Configuration>,
  revalidate: Revalidator,
  opts: Required<RevalidatorOptions>
): void {
  if (!preset.isDocumentVisible()) {
    // If it's hidden, stop. It will auto revalidate when refocusing.
    return
  }

  const maxRetryCount = config.errorRetryCount
  const currentRetryCount = opts.retryCount
  if (maxRetryCount !== UNDEFINED && currentRetryCount > maxRetryCount) {
    return
  }

  // Exponential backoff
  const timeout =
    ~~((Math.random() + 0.5) * (1 << Math.min(currentRetryCount, 8))) *
    config.errorRetryInterval
  setTimeout(revalidate, timeout, opts)
}

// Default config
const defaultConfig: Configuration = {
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
  fetcher,
  compare: dequal,
  isPaused: () => false,
  cache: wrapCache(new Map()),

  // use web preset by default
  ...preset
} as const

export default defaultConfig
