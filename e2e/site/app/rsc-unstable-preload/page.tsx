import { connection } from 'next/server'
import { preload } from 'swr'
import type { CacheData } from 'swr'
import { sleep } from '~/lib/sleep'
import { ClientRoot } from './client'
import { key } from './key'

async function getServerData() {
  await sleep(150)
  return 'SWR_RSC_PRELOAD_FLIGHT_MARKER_20260621'
}

export default async function Page() {
  // Opt into dynamic rendering so each request preloads fresh server data.
  await connection()

  // Runtime resolves the react-server export; this app's type checker still
  // reads the default client preload signature.
  const cacheData = preload(key, getServerData) as unknown as CacheData<string>

  return <ClientRoot cacheData={cacheData} />
}
