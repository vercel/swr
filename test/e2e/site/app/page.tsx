'use client'

import { Suspense, useReducer } from 'react'
import useSWR from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'

const fetcher = async (key: string) => {
  // Add a small delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 100))
  return 'SWR'
}

const Section = ({ trigger }: { trigger: boolean }) => {
  const { data } = useSWR(trigger ? 'test-key' : undefined, fetcher, {
    suspense: true
  })
  return <div>{data || 'empty'}</div>
}

export default function Page() {
  const [trigger, toggle] = useReducer(x => !x, false)

  return (
    <OnlyRenderInClient>
      <button onClick={toggle}>toggle</button>
      <Suspense fallback={<div>fallback</div>}>
        <Section trigger={trigger} />
      </Suspense>
    </OnlyRenderInClient>
  )
}
