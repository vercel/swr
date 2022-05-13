import utils, { InternalUtils } from 'swr/_internal'

const [
  serialize,
  useStateWithDeps,
  withMiddleware,
  useIsomorphicLayoutEffect,
  UNDEFINED,
  getTimestamp
] = [
  utils[InternalUtils.serialize],
  utils[InternalUtils.useStateWithDeps],
  utils[InternalUtils.withMiddleware],
  utils[InternalUtils.useIsomorphicLayoutEffect],
  utils[InternalUtils.UNDEFINED],
  utils[InternalUtils.getTimestamp]
] as const

export {
  serialize,
  useStateWithDeps,
  withMiddleware,
  useIsomorphicLayoutEffect,
  UNDEFINED,
  getTimestamp
}
