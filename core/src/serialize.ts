import type { Key } from 'swr'
import { serialize } from 'swr/_internal'

export const unstable_serialize = (key: Key) => serialize(key)[0]
