import type { Key, Fetcher, Middleware, SWRConfiguration } from '../index'
import useSWR from '../index'
import { normalize } from '../_internal'

/**
Marks a `refreshInterval` that was passed directly to the hook, as opposed to
one inherited from a parent `<SWRConfig>`. The `immutable` middleware runs after
both sources have been merged into a single config, so the distinction has to be
recorded before that merge happens.
*/
const HOOK_LEVEL_REFRESH_INTERVAL = Symbol.for('swr.immutable.refreshInterval')

export const immutable: Middleware = useSWRNext => (key, fetcher, config) => {
  // Always override all revalidate options.
  config.revalidateOnFocus = false
  config.revalidateIfStale = false
  config.revalidateOnReconnect = false

  // Only clear a `refreshInterval` inherited from a parent `<SWRConfig>`. One
  // passed directly to the hook is an explicit opt-in to polling, so it's kept.
  if (!(HOOK_LEVEL_REFRESH_INTERVAL in config)) {
    config.refreshInterval = 0
  }

  return useSWRNext(key, fetcher, config)
}

const useSWRImmutable = <Data = any, Error = any>(
  ...args:
    | [Key]
    | [Key, Fetcher<Data> | null]
    | [Key, SWRConfiguration | undefined]
    | [Key, Fetcher<Data> | null, SWRConfiguration | undefined]
) => {
  const [key, fn, config] = normalize<Key, Data>(args)
  const uses = (config.use || []).concat(immutable)

  // Record whether `refreshInterval` came from the hook itself, before the
  // context config is merged in and the two become indistinguishable.
  const nextConfig: Record<string | symbol, unknown> = { ...config, use: uses }
  if (config.refreshInterval !== undefined) {
    nextConfig[HOOK_LEVEL_REFRESH_INTERVAL] = true
  }

  return useSWR<Data, Error>(key, fn, nextConfig as SWRConfiguration)
}

export default useSWRImmutable
