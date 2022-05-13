import SWRConfig from './utils/config-context'
import * as revalidateEvents from './constants'
import { subscribeCallback } from './utils/subscribe-key'
import { defaultConfig, cache, mutate } from './utils/config'
import { SWRGlobalState } from './utils/global-state'
import { stableHash } from './utils/hash'
import { internalMutate } from './utils/mutate'
import { normalize } from './utils/normalize-args'
import { withArgs } from './utils/resolve-args'
import { serialize } from './utils/serialize'
import { useStateWithDeps } from './utils/state'
import { getTimestamp } from './utils/timestamp'
import { useSWRConfig } from './utils/use-swr-config'
import { withMiddleware } from './utils/with-middleware'
import {
  IS_REACT_LEGACY,
  IS_SERVER,
  rAF,
  useIsomorphicLayoutEffect
} from './utils/env'
import {
  UNDEFINED,
  OBJECT,
  isUndefined,
  isFunction,
  isEmptyCache,
  mergeObjects,
  createCacheHelper
} from './utils/helper'

export * from './types'
export { InternalUtils } from './enums'

export default [
  serialize,
  useIsomorphicLayoutEffect,
  UNDEFINED,
  subscribeCallback,
  revalidateEvents,
  cache,
  mutate,
  isUndefined,
  isFunction,
  SWRConfig,
  defaultConfig,
  SWRGlobalState,
  stableHash,
  internalMutate,
  normalize,
  withArgs,
  useStateWithDeps,
  getTimestamp,
  useSWRConfig,
  withMiddleware,
  IS_REACT_LEGACY,
  IS_SERVER,
  rAF,
  OBJECT,
  isEmptyCache,
  mergeObjects,
  createCacheHelper
] as const
