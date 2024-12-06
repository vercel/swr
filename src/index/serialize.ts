import type { Key } from '../_internal'
import { serialize } from '../_internal'

export const unstable_serialize = (key: Key) => serialize(key)[0]
