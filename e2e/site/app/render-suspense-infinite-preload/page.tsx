'use client'

import { Suspense, useEffect, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { preload } from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

const baseKey = 'render-suspense-infinite-preload'
const getKey = (index: number) => `${baseKey}-${index}`

let fetchCount = 0
let preloaded = false
let fallbackRenderCount = 0

async function fetcher(key: string) {
  fetchCount += 1
  await sleep(100)
  return `${key}-value`
}

if (!preloaded) {
  preloaded = true
  preload(getKey(0), fetcher)
}

function Section() {
  const { data } = useSWRInfinite(index => getKey(index), fetcher, {
    suspense: true
  })

  const [count, setCount] = useState(fetchCount)
  const [fallbackCount, setFallbackCount] = useState(fallbackRenderCount)
  useEffect(() => {
    setCount(fetchCount)
    setFallbackCount(fallbackRenderCount)
  }, [data])

  const firstPage = data?.[0]

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div data-testid="data">{firstPage ?? 'no-data'}</div>
      <div data-testid="fetch-count">fetches: {count}</div>
      <div data-testid="fallback-count">fallback renders: {fallbackCount}</div>
    </div>
  )
}

function Fallback() {
  fallbackRenderCount += 1
  return <div data-testid="fallback">loading</div>
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <Suspense fallback={<Fallback />}>
        <Section />
      </Suspense>
    </OnlyRenderInClient>
  )
}
