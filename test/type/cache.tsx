import React from 'react'
import { useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'

export function useCacheClear() {
  const { data } = useSWR('use-custom-cache-1', v => v)
  const { cache } = useSWRConfig()

  useEffect(() => {
    return () => cache.clear()
  }, [])
  return <div>{data}</div>
}
