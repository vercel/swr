'use client'

import { Suspense, useState } from 'react'
import useSWRInfinite from 'swr/infinite'
import { OnlyRenderInClient } from '~/component/only-render-in-client'

const DATA: Record<string, string[]> = {
  'suspense-key-a': ['A1', 'A2', 'A3'],
  'suspense-key-b': ['B1', 'B2', 'B3']
}

async function fetchList(key: string) {
  await new Promise(resolve => setTimeout(resolve, 150))
  return DATA[key]
}

function List() {
  const [status, setStatus] = useState<'a' | 'b'>('a')
  const { data, setSize } = useSWRInfinite(
    () => (status === 'a' ? 'suspense-key-a' : 'suspense-key-b'),
    fetchList,
    { suspense: true }
  )

  return (
    <>
      <div data-testid="data">data: {String(data)}</div>
      <button
        type="button"
        onClick={() => {
          setStatus('b')
          void setSize(1)
        }}
      >
        mutate
      </button>
    </>
  )
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <Suspense fallback={<div>loading</div>}>
        <List />
      </Suspense>
    </OnlyRenderInClient>
  )
}
