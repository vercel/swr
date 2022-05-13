import utils, { InternalUtils } from 'swr/_internal'

const [
  defaultConfig,
  SWRGlobalState,
  serialize,
  createCacheHelper,
  isEmptyCache,
  IS_REACT_LEGACY,
  IS_SERVER,
  UNDEFINED,
  OBJECT,
  getTimestamp,
  isUndefined,
  isFunction,
  withArgs,
  internalMutate,
  FOCUS_EVENT,
  RECONNECT_EVENT,
  MUTATE_EVENT,
  useIsomorphicLayoutEffect,
  subscribeCallback,
  rAF,
  ConfigProvider,
  mutate,
  useSWRConfig
] = [
  utils[InternalUtils.defaultConfig],
  utils[InternalUtils.SWRGlobalState],
  utils[InternalUtils.serialize],
  utils[InternalUtils.createCacheHelper],
  utils[InternalUtils.isEmptyCache],
  utils[InternalUtils.IS_REACT_LEGACY],
  utils[InternalUtils.IS_SERVER],
  utils[InternalUtils.UNDEFINED],
  utils[InternalUtils.OBJECT],
  utils[InternalUtils.getTimestamp],
  utils[InternalUtils.isUndefined],
  utils[InternalUtils.isFunction],
  utils[InternalUtils.withArgs],
  utils[InternalUtils.internalMutate],
  utils[InternalUtils.FOCUS_EVENT],
  utils[InternalUtils.RECONNECT_EVENT],
  utils[InternalUtils.MUTATE_EVENT],
  utils[InternalUtils.useIsomorphicLayoutEffect],
  utils[InternalUtils.subscribeCallback],
  utils[InternalUtils.rAF],
  utils[InternalUtils.SWRConfig],
  utils[InternalUtils.mutate],
  utils[InternalUtils.useSWRConfig]
] as const

export {
  defaultConfig,
  SWRGlobalState,
  serialize,
  createCacheHelper,
  isUndefined,
  isEmptyCache,
  IS_REACT_LEGACY,
  IS_SERVER,
  UNDEFINED,
  OBJECT,
  getTimestamp,
  isFunction,
  withArgs,
  internalMutate,
  FOCUS_EVENT,
  RECONNECT_EVENT,
  MUTATE_EVENT,
  useIsomorphicLayoutEffect,
  subscribeCallback,
  rAF,
  ConfigProvider,
  mutate,
  useSWRConfig
}