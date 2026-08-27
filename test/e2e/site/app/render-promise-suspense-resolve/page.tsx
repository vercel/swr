'use client'

import { Suspense, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import useSWR, { SWRConfig } from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'
import { useDebugHistory } from '~/lib/use-debug-history'

const key = 'render-promise-suspense-resolve'
const fallbackDelay = 150
const fetchDelay = 200

async function fetcher() {
  await sleep(fetchDelay)
  return 'new data'
}

function PromiseConfig({ children }: { children: ReactNode }) {
  const [fallback] = useState(() =>
    sleep(fallbackDelay).then(() => 'initial data')
  )

  const value = useMemo(() => ({ fallback: { [key]: fallback } }), [fallback])

  return <SWRConfig value={value}>{children}</SWRConfig>
}

function Content() {
  const { data } = useSWR(key, fetcher)
  const historyRef = useDebugHistory(data, 'history:')

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div data-testid="data">data:{data ?? 'undefined'}</div>
      <div data-testid="history" ref={historyRef}></div>
    </div>
  )
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <PromiseConfig>
        <Suspense fallback={<div data-testid="fallback">loading</div>}>
          <Content />
        </Suspense>
      </PromiseConfig>
    </OnlyRenderInClient>
  )
}
