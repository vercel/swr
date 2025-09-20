'use client'

import { Suspense, useEffect, useState } from 'react'
import useSWR, { preload } from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

const key = 'render-preload-basic'
let fetchCount = 0

async function fetcher() {
  await sleep(100)
  fetchCount += 1
  return 'foo'
}

function Preload({ children }: { children?: React.ReactNode }) {
  const [isPreloaded, setIsPreloaded] = useState(false)

  useEffect(() => {
    preload(key, fetcher)
    setIsPreloaded(true)
  }, [])
  return <>{isPreloaded ? children : null}</>
}

export default function Page() {
  const { data } = useSWR(key, fetcher)
  const [count, setCount] = useState(fetchCount)

  useEffect(() => {
    setCount(fetchCount)
  }, [data])

  return (
    <OnlyRenderInClient>
      <Preload>
        <Suspense fallback={<div>Loading...</div>}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div data-testid="data">data:{data ?? ''}</div>
            <div data-testid="fetch-count">fetches: {count}</div>
          </div>
        </Suspense>
      </Preload>
    </OnlyRenderInClient>
  )
}
