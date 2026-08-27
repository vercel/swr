'use client'

import useSWR from 'swr'
import { useDebugHistory } from '~/lib/use-debug-history'

export default function Block() {
  const { data } = useSWR<string>('/api/data', async (url: string) => {
    const res = await fetch(url).then(v => v.json())
    return res.name
  })
  const debugRef = useDebugHistory(data, 'history:')
  return (
    <>
      <div ref={debugRef}></div>
      <div>result:{data || 'undefined'}</div>
    </>
  )
}
