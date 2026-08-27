'use client'

import { Suspense, useReducer } from 'react'
import useSWR from 'swr'

const fetcher = async (key: string) => {
  // Delay long enough that tests can reliably observe the suspense fallback.
  await new Promise(resolve => setTimeout(resolve, 500))
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
    <div>
      <button onClick={toggle}>toggle</button>
      <Suspense fallback={<div>fallback</div>}>
        <Section trigger={trigger} />
      </Suspense>
    </div>
  )
}
