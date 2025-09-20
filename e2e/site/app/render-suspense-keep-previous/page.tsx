'use client'

import { Suspense, useState } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

async function fetchValue(key: string) {
  await sleep(150)
  return `data:${key}`
}

function Section() {
  const [query, setQuery] = useState('origin')
  const { data } = useSWR(query, fetchValue, {
    suspense: true,
    keepPreviousData: true
  })

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div data-testid="data">{data}</div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setQuery('origin')}
          data-testid="set-origin"
        >
          origin
        </button>
        <button
          type="button"
          onClick={() => setQuery('next')}
          data-testid="set-next"
        >
          next
        </button>
      </div>
    </div>
  )
}

function Fallback() {
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
