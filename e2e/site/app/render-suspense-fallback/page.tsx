'use client'

import { Suspense } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

async function fetchGreeting() {
  await sleep(500)
  return 'SWR'
}

function Section() {
  const { data } = useSWR<string>('render-suspense-fallback', fetchGreeting, {
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
