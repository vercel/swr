import { unstable_preload } from 'swr'
import { sleep } from '~/lib/sleep'
import { ClientRoot } from './client'
import { key } from './key'

export const dynamic = 'force-dynamic'

async function getServerData() {
  await sleep(150)
  return 'server data'
}

export default function Page() {
  const serverData = unstable_preload(key, getServerData)

  return <ClientRoot preload={serverData} />
}
