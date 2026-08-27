'use client'

import { Suspense, useState } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

async function fetchValue(key: string) {
  await sleep(150)
  return key
}

function Result({ query }: { query: string }) {
  const { data } = useSWR(
    query ? `render-suspense-null-key-${query}` : null,
    fetchValue,
    {
      suspense: true
    }
  )

  const text = data ?? 'render-suspense-null-key-nodata'

  return <div data-testid="data">{text}</div>
}

export default function Page() {
  const [query, setQuery] = useState('123')

  return (
    <OnlyRenderInClient>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setQuery('123')}
            data-testid="set-123"
          >
            set 123
          </button>
          <button
            type="button"
            onClick={() => setQuery('')}
            data-testid="set-empty"
          >
            clear
          </button>
          <button
            type="button"
            onClick={() => setQuery('456')}
            data-testid="set-456"
          >
            set 456
          </button>
        </div>
        <Suspense fallback={null}>
          <Result query={query} />
        </Suspense>
      </div>
    </OnlyRenderInClient>
  )
}
