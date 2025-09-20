'use client'

import { Suspense } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchValue(key: string) {
  if (key === 'render-suspense-multiple-fallbacks-1') {
    await delay(50)
    return 1
  }
  await delay(140)
  return 2
}

function Section() {
  const { data: v1 } = useSWR<number>(
    'render-suspense-multiple-fallbacks-1',
    fetchValue,
    { suspense: true }
  )
  const { data: v2 } = useSWR<number>(
    'render-suspense-multiple-fallbacks-2',
    fetchValue,
    { suspense: true }
  )

  return <div data-testid="data">{(v1 ?? 0) + (v2 ?? 0)}</div>
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
