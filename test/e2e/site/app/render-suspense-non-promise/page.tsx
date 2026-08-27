'use client'

import { Suspense } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'

function Section() {
  const { data } = useSWR('render-suspense-non-promise', () => 'hello', {
    suspense: true
  })

  return <div data-testid="data">{data}</div>
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
