'use client'

import { Suspense, useEffect, useState } from 'react'
import useSWR, { preload } from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

const keyA = 'render-preload-avoid-waterfall:a'
const keyB = 'render-preload-avoid-waterfall:b'
const delay = 200

async function fetcherA() {
  await sleep(delay)
  return 'foo'
}

async function fetcherB() {
  await sleep(delay)
  return 'bar'
}

function Preload({ children }: { children?: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    preload(keyA, fetcherA)
    preload(keyB, fetcherB)
    setReady(true)
  }, [])

  return ready ? <>{children}</> : null
}

function Content() {
  const { data: first } = useSWR(keyA, fetcherA, { suspense: true })
  const { data: second } = useSWR(keyB, fetcherB, { suspense: true })

  useEffect(() => {
    if (!first || !second) {
      return
    }
  }, [first, second])

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div data-testid="data">
        data:{first}:{second}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <Preload>
        <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
          <Content />
        </Suspense>
      </Preload>
    </OnlyRenderInClient>
  )
}
