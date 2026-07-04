import { connection } from 'next/server'
import { preload } from 'swr'
import type { CacheData } from 'swr'
import { sleep } from '~/lib/sleep'
import { ClientRoot } from './client'
import { key } from './key'

async function getServerData() {
  await sleep(150)
  return 'SWR_RSC_PRELOAD_CONDITIONAL_MARKER_20260621'
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ preload?: string }>
}) {
  // Opt into dynamic rendering so each request preloads fresh server data.
  await connection()

  const { preload: shouldPreload } = await searchParams

  // Only preload when the search param is present. A request that preloaded
  // must not leak its server-loaded data into a later request that didn't,
  // since the SWR global state is shared across requests on the server.
  // Runtime resolves the react-server export; this app's type checker still
  // reads the default client preload signature.
  const cacheData = (shouldPreload
    ? preload(key, getServerData)
    : {}) as unknown as CacheData<string>

  return <ClientRoot cacheData={cacheData} />
}
