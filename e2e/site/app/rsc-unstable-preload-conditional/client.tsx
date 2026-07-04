'use client'

import { Suspense, useCallback, useState } from 'react'
import useSWR, { SWRConfig, useSWRConfig } from 'swr'
import type { CacheData } from 'swr'
import { key } from './key'

function ClientData({
  fetcher,
  clientFetches
}: {
  fetcher: () => Promise<string>
  clientFetches: number
}) {
  const { cache } = useSWRConfig()
  const { data, mutate } = useSWR(key, fetcher, { suspense: true })
  const cachedData = cache.get(key)?.data

  return (
    <>
      <div data-testid="data">data:{data}</div>
      <div data-testid="cache">cache:{cachedData}</div>
      <div data-testid="client-fetches">client fetches:{clientFetches}</div>
      <button data-testid="revalidate" onClick={() => void mutate()}>
        revalidate
      </button>
    </>
  )
}

export function ClientRoot({ cacheData }: { cacheData: CacheData<string> }) {
  const [clientFetches, setClientFetches] = useState(0)
  const fetcher = useCallback(async () => {
    ;(
      window as typeof window & {
        __SWR_RSC_CLIENT_FETCHER_CALLED__?: () => void
      }
    ).__SWR_RSC_CLIENT_FETCHER_CALLED__?.()
    queueMicrotask(() => setClientFetches(count => count + 1))
    return 'CLIENT_FETCHER_RESULT_AFTER_TRIGGER'
  }, [])

  return (
    <SWRConfig value={{ cacheData }}>
      <Suspense fallback={<div data-testid="fallback">loading</div>}>
        <ClientData fetcher={fetcher} clientFetches={clientFetches} />
      </Suspense>
    </SWRConfig>
  )
}
