import { preload } from 'swr'
import { sleep } from '~/lib/sleep'
import { ClientRoot } from './client'
import { key } from './key'

export const dynamic = 'force-dynamic'

async function getServerData() {
  await sleep(150)
  return 'SWR_RSC_PRELOAD_FLIGHT_MARKER_20260621'
}

export default function Page() {
  const cacheData = preload(key, getServerData)

  return <ClientRoot cacheData={cacheData} />
}
