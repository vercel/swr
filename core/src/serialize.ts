import type { CustomHashes, Key } from 'swr/_internal'
import { serialize } from 'swr/_internal'

export const unstable_serialize = (key: Key, customHashes?: CustomHashes) =>
  serialize(key, customHashes)[0]
