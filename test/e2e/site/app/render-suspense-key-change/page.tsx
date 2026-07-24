'use client'

import { Suspense, useState } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

async function fetchValue(key: string) {
  await sleep(120)
  return key
}

function Section() {
  const [key, setKey] = useState('initial')
  const { data } = useSWR(
    key ? `render-suspense-key-change-${key}` : null,
    fetchValue,
    { suspense: true }
  )

  return (
    <div>
      <div data-testid="data">data: {data}</div>
      <button
        type="button"
        onClick={() => setKey('updated')}
        data-testid="toggle"
      >
        change
      </button>
    </div>
  )
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <Suspense fallback={<div data-testid="fallback">fallback</div>}>
        <Section />
      </Suspense>
    </OnlyRenderInClient>
  )
}
