'use client'

import { Suspense } from 'react'
// @ts-ignore React DOM's new Canary API is not in the installed types yet.
import { browser } from 'react-dom'
import useSWR, { SWRConfig } from 'swr'
import useSWRInfinite from 'swr/infinite'

async function fetchInBrowser(key: string) {
  if (typeof window === 'undefined') {
    throw new Error('The browser-only fetcher ran on the server')
  }
  await new Promise(resolve => setTimeout(resolve, 100))
  return `client:${key}`
}

function BrowserData() {
  const { data } = useSWR('browser', fetchInBrowser, {
    suspense: true,
    unstable_browser: browser
  })
  return <div data-testid="browser-data">{data}</div>
}

function InfiniteData() {
  const { data } = useSWRInfinite(() => 'infinite', fetchInBrowser, {
    suspense: true
  })
  return <div data-testid="infinite-data">{data?.join(',')}</div>
}

function ServerData() {
  const { data } = useSWR('server', fetchInBrowser, {
    suspense: true,
    fallbackData: 'server data',
    revalidateIfStale: false
  })
  return <div data-testid="server-data">{data}</div>
}

function DisabledData() {
  const { data } = useSWR(null, fetchInBrowser, { suspense: true })
  return <div data-testid="disabled-data">{data ?? 'disabled'}</div>
}

function PreloadedData() {
  const { data } = useSWR('preloaded', fetchInBrowser, {
    suspense: true,
    revalidateIfStale: false
  })
  return <div data-testid="preloaded-data">{data}</div>
}

export default function Page() {
  // Fail visibly if the test runtime does not actually support the API.
  if (typeof browser !== 'function') {
    throw new Error('This test requires React DOM browser support')
  }

  return (
    <>
      <Suspense fallback={<div data-testid="browser-fallback">loading</div>}>
        <BrowserData />
      </Suspense>
      <SWRConfig
        value={{
          unstable_browser: browser,
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
