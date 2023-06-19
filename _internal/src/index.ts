import SWRConfig from './utils/config-context'
import * as revalidateEvents from './constants'

export { SWRConfig, revalidateEvents }

export { initCache } from './utils/cache'
export { defaultConfig, cache, mutate, compare } from './utils/config'
import { setupDevTools } from './utils/devtools'
export * from './utils/env'
export { SWRGlobalState } from './utils/global-state'
export { stableHash } from './utils/hash'
export * from './utils/helper'
export * from './utils/shared'
export { mergeConfigs } from './utils/merge-config'
export { internalMutate } from './utils/mutate'
export { normalize } from './utils/normalize-args'
export { withArgs } from './utils/resolve-args'
export { serialize } from './utils/serialize'
export { useStateWithDeps } from './utils/state'
export { subscribeCallback } from './utils/subscribe-key'
export { getTimestamp } from './utils/timestamp'
export { useSWRConfig } from './utils/use-swr-config'
export { preset, defaultConfigOptions } from './utils/web-preset'
export { withMiddleware } from './utils/with-middleware'
export { preload } from './utils/preload'

export * from './types'

setupDevTools()
