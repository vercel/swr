'use client'

import { Suspense, useState } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

async function fetchValue() {
  await sleep(120)
  return '123'
}

function Section() {
  const [step, setStep] = useState(1)
  const { data } = useSWR(`render-suspense-same-data-${step}`, fetchValue, {
    suspense: true
  })

  return (
    <div>
      <div data-testid="data">
        data: {data},{step}
      </div>
      <button
        type="button"
        data-testid="increment"
        onClick={() => setStep(current => current + 1)}
      >
        next
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
