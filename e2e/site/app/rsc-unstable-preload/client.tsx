'use client'

import { Suspense } from 'react'
import useSWR, { SWRConfig, useSWRConfig } from 'swr'
import type { UnstablePreloadEntry } from 'swr'
import { key } from './key'

let clientFetches = 0

async function fetcher() {
  clientFetches += 1
  return 'client data'
}

function ClientData() {
  const { cache } = useSWRConfig()
  const { data } = useSWR(key, fetcher, {
    suspense: true,
    revalidateIfStale: false
  })
  const cachedData = cache.get(key)?.data

  return (
    <>
      <div data-testid="data">data:{data}</div>
      <div data-testid="cache">cache:{cachedData}</div>
      <div data-testid="client-fetches">client fetches:{clientFetches}</div>
    </>
  )
}

export function ClientRoot({
  preload
}: {
  preload: UnstablePreloadEntry<string>
}) {
  return (
    <SWRConfig value={{ unstable_preload: [preload] }}>
      <Suspense fallback={<div data-testid="fallback">loading</div>}>
        <ClientData />
      </Suspense>
    </SWRConfig>
  )
}
