'use client'

import { Suspense, useRef, useState } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

function Section() {
  const [prefix, setPrefix] = useState('a')
  const fetcherRef = useRef<() => Promise<string>>(() =>
    sleep(100).then(() => 'foo')
  )

  const { data } = useSWR(
    `render-suspense-fetcher-${prefix}`,
    () => fetcherRef.current(),
    { suspense: true }
  )

  return (
    <div style={{ display: 'grid', gap: '0.75rem' }}>
      <div data-testid="data">data:{data}</div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => {
            fetcherRef.current = () => sleep(100).then(() => 'foo')
            setPrefix('a')
          }}
          data-testid="set-foo"
        >
          set foo
        </button>
        <button
          type="button"
          onClick={() => {
            fetcherRef.current = () => sleep(100).then(() => 'bar')
            setPrefix('b')
          }}
          data-testid="set-bar"
        >
          set bar
        </button>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <Suspense fallback={<div data-testid="fallback">loading</div>}>
        <Section />
      </Suspense>
    </OnlyRenderInClient>
  )
}
