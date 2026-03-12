'use client'

import { Suspense, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import useSWR, { SWRConfig } from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

const key = 'render-promise-suspense-error'
const fallbackDelay = 150

function PromiseConfig({ children }: { children: ReactNode }) {
  const [fallback] = useState(() =>
    sleep(fallbackDelay).then(() => {
      throw new Error('error')
    })
  )

  const value = useMemo(() => ({ fallback: { [key]: fallback } }), [fallback])

  return <SWRConfig value={value}>{children}</SWRConfig>
}

function Content() {
  const { data } = useSWR<string>(key)
  return <div data-testid="data">data:{data ?? 'undefined'}</div>
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <PromiseConfig>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <div data-testid="error">{error.message}</div>
          )}
        >
          <Suspense fallback={<div data-testid="fallback">loading</div>}>
            <Content />
          </Suspense>
        </ErrorBoundary>
      </PromiseConfig>
    </OnlyRenderInClient>
  )
}
