import React from 'react'
import { useEffect } from 'react'
import { DefaultProvider, SWRConfig, useSWRConfig } from 'swr'

export function test1() {
  function useCacheClear() {
    const { cache: defaultCache } = useSWRConfig()
    const { cache } = useSWRConfig<DefaultProvider>()

    useEffect(() => {
      return () => {
        cache.clear() // infer DefaultProvider
        defaultCache.clear() // infer DefaultProvider
      }
    }, [])
    return null
  }

  return useCacheClear
}

export function test2() {
  const provider2 = new Map([['k1', 'v1']])
  function Inner() {
    // infer Map<string, string>
    const { cache } = useSWRConfig<typeof provider2>()

    useEffect(() => {
      return () => cache.clear()
    }, [])
    return null
  }

  function useCustomCache2() {
    return (
      <SWRConfig value={{ provider: () => provider2 }}>
        <SWRConfig value={{ provider: (c: typeof provider2) => c }}>
          <Inner />
        </SWRConfig>
      </SWRConfig>
    )
  }

  return useCustomCache2
}
