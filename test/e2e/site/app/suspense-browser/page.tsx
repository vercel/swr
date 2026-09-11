'use client'

import { Suspense } from 'react'
import { SWRConfig } from 'swr'
import useSWRSuspense from 'swr/suspense'
import useSWRInfiniteSuspense from 'swr/infinite/suspense'

async function fetchInBrowser(key: string) {
  if (typeof window === 'undefined') {
    throw new Error('The browser-only fetcher ran on the server')
  }
  await new Promise(resolve => setTimeout(resolve, 100))
  return `client:${key}`
}

function BrowserData() {
  const { data } = useSWRSuspense('browser', fetchInBrowser)
  return <div data-testid="browser-data">{data}</div>
}

function InfiniteData() {
  const { data } = useSWRInfiniteSuspense(() => 'infinite', fetchInBrowser)
  return <div data-testid="infinite-data">{data?.join(',')}</div>
}

function ServerData() {
  const { data } = useSWRSuspense('server', fetchInBrowser, {
    fallbackData: 'server data',
    revalidateIfStale: false
  })
  return <div data-testid="server-data">{data}</div>
}

function DisabledData() {
  const { data } = useSWRSuspense(null, fetchInBrowser)
  return <div data-testid="disabled-data">{data ?? 'disabled'}</div>
}

function PreloadedData() {
  const { data } = useSWRSuspense('preloaded', fetchInBrowser, {
    revalidateIfStale: false
  })
  return <div data-testid="preloaded-data">{data}</div>
}

export default function Page() {
  return (
    <>
      <Suspense fallback={<div data-testid="browser-fallback">loading</div>}>
        <BrowserData />
      </Suspense>
      <SWRConfig
        value={{
          cacheData: { preloaded: 'preloaded data' }
        }}
      >
        <Suspense fallback={<div data-testid="infinite-fallback">loading</div>}>
          <InfiniteData />
        </Suspense>
        <Suspense fallback={<div data-testid="server-fallback">loading</div>}>
          <ServerData />
        </Suspense>
        <Suspense fallback={<div data-testid="disabled-fallback">loading</div>}>
          <DisabledData />
        </Suspense>
        <Suspense
          fallback={<div data-testid="preloaded-fallback">loading</div>}
        >
          <PreloadedData />
        </Suspense>
      </SWRConfig>
    </>
  )
}
