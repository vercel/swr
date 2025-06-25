'use client'
import { useState } from 'react'
import useSWR from 'swr'

const elementCount = 10_000
const useData = () => {
  return useSWR('1', async (url: string) => {
    return 1
  })
}

const HookUser = () => {
  const { data } = useData()
  return <div>{data}</div>
}
/**
 * This renders 10,000 divs and is used to compare against the render performance
 * when using swr.
 */
const CheapComponent = () => {
  const cheapComponents = Array.from({ length: 10_000 }, (_, i) => (
    <div key={i}>{i}</div>
  ))
  return (
    <div>
      <h2>Cheap Component</h2>
      {cheapComponents}
    </div>
  )
}

/**
 * This renders 10,000 divs, each of which uses the same swr hook.
 */
const ExpensiveComponent = () => {
  const hookComponents = Array.from({ length: 10_000 }, (_, i) => (
    <HookUser key={i} />
  ))
  return (
    <div>
      <h2>Expensive Component</h2>
      {hookComponents}
    </div>
  )
}

export default function PerformancePage() {
  const [renderExpensive, setRenderExpensive] = useState(false)
  return (
    <div>
      <h1>Performance Page</h1>
      <label>
        <input
          type="checkbox"
          checked={renderExpensive}
          onChange={e => setRenderExpensive(e.target.checked)}
        />
        Toggle Expensive Component
      </label>
      {!renderExpensive ? <CheapComponent /> : <ExpensiveComponent />}
    </div>
  )
}
