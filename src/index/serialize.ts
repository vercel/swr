import type { Key } from '../_internal'
import { serialize } from '../_internal/utils/serialize'

export const unstable_serialize = (key: Key) => serialize(key)[0]
