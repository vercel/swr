'use client'

import { Suspense } from 'react'
import useSWR from 'swr'
import { ErrorBoundary } from 'react-error-boundary'
import { OnlyRenderInClient } from '~/component/only-render-in-client'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithError(): Promise<string> {
  await delay(120)
  throw new Error('error')
}

function Section() {
  const { data } = useSWR('render-suspense-error', fetchWithError, {
    suspense: true
  })

  return <div data-testid="data">{data}</div>
}

function ErrorFallback(_: { error: Error; resetErrorBoundary: () => void }) {
  return <div data-testid="error">error boundary</div>
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div data-testid="fallback">fallback</div>}>
          <Section />
        </Suspense>
      </ErrorBoundary>
    </OnlyRenderInClient>
  )
}
