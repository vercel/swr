'use client'

import { Suspense, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import useSWR, { SWRConfig } from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

const key = 'render-promise-suspense-shared'
const fallbackDelay = 150

function PromiseConfig({ children }: { children: ReactNode }) {
  const [fallback] = useState(() => sleep(fallbackDelay).then(() => 'value'))
  const value = useMemo(() => ({ fallback: { [key]: fallback } }), [fallback])
  return <SWRConfig value={value}>{children}</SWRConfig>
}

function Item({ id }: { id: string }) {
  const { data } = useSWR<string>(key)
  return <div data-testid={`data-${id}`}>data:{data ?? 'undefined'}</div>
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <PromiseConfig>
        <Suspense fallback={<div data-testid="fallback">loading</div>}>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <Item id="first" />
            <Item id="second" />
          </div>
        </Suspense>
      </PromiseConfig>
    </OnlyRenderInClient>
  )
}
