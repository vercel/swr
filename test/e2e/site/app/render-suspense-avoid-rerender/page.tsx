'use client'

import { Suspense, useRef } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

async function fetchValue() {
  await sleep(150)
  return 'SWR'
}

function Section() {
  const startCountRef = useRef(0)
  const dataCountRef = useRef(0)
  const prevDataRef = useRef<any>(Symbol('initial'))

  startCountRef.current += 1

  const { data } = useSWR('render-suspense-avoid-rerender', fetchValue, {
    suspense: true
  })

  if (data !== prevDataRef.current) {
    if (data !== undefined) {
      dataCountRef.current += 1
    }
    prevDataRef.current = data
  }

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div data-testid="start-count">
        start renders: {startCountRef.current}
      </div>
      <div data-testid="data-count">data renders: {dataCountRef.current}</div>
      <div data-testid="data">{data}</div>
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
