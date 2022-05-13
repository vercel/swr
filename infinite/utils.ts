import utils, { InternalUtils } from 'swr/_internal'

const [
  isUndefined,
  isFunction,
  UNDEFINED,
  createCacheHelper,
  useIsomorphicLayoutEffect,
  serialize,
  withMiddleware
] = [
  utils[InternalUtils.isUndefined],
  utils[InternalUtils.isFunction],
  utils[InternalUtils.UNDEFINED],
  utils[InternalUtils.createCacheHelper],
  utils[InternalUtils.useIsomorphicLayoutEffect],
  utils[InternalUtils.serialize],
  utils[InternalUtils.withMiddleware]
] as const

export {
  isUndefined,
  isFunction,
  UNDEFINED,
  createCacheHelper,
  useIsomorphicLayoutEffect,
  serialize,
  withMiddleware
}
