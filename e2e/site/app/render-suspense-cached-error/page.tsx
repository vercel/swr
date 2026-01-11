'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import useSWR, { SWRConfig } from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

async function fetchWithError(): Promise<string> {
  await sleep(150)
  throw new Error('error')
}

function Section() {
  const { data, error } = useSWR<string>(
    'render-suspense-cached-error',
    fetchWithError,
    { suspense: true }
  )

  return (
    <div data-testid="result">
      data: {data ?? ''}, error: {error?.message ?? ''}
    </div>
  )
}

const cache = new Map()
cache.set('render-suspense-cached-error', 'hello')
const cacheProvider = () => cache

function ErrorFallback(_: { error: Error; resetErrorBoundary: () => void }) {
  return <div data-testid="error">error boundary</div>
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <SWRConfig
        value={{
          provider: cacheProvider
        }}
      >
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div data-testid="fallback">fallback</div>}>
            <Section />
          </Suspense>
        </ErrorBoundary>
      </SWRConfig>
    </OnlyRenderInClient>
  )
}
