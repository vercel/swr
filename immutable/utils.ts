import utils, { InternalUtils } from 'swr/_internal'

const [withMiddleware] = [utils[InternalUtils.withMiddleware]] as const

export { withMiddleware }
