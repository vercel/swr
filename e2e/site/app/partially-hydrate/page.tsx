'use client'
import { useDebugHistory } from '~/lib/use-debug-history'
import useData from './use-data'

let resolved = false
const susp = new Promise(res => {
  setTimeout(() => {
    resolved = true
    res(true)
  }, 2000)
})

export default function Page() {
  // We trigger the suspense boundary here!
  if (!resolved) {
    throw susp
  }

  const { data } = useData()
  const debugRef = useDebugHistory(data, 'second history:')
  return (
    <div>
      <div ref={debugRef}></div>
      <>second data (delayed hydration):{data || 'undefined'}</>
    </div>
  )
}
