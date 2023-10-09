import type { Key } from 'swr/_internal'
import { serialize } from 'swr/_internal'

export const unstable_serialize = (key: Key) => serialize(key)[0]
