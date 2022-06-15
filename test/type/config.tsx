import React from 'react'
import { useSWRConfig, SWRConfig, Cache, State } from 'swr'
import { expectType } from './utils'

interface CustomCache<Data = any> extends Cache<Data> {
  reset(): void
}

export function useTestCache() {
  expectType<Map<string, State>>(useSWRConfig().cache)
  expectType<Map<string, State>>(useSWRConfig<Map<string, State>>().cache)
  expectType<CustomCache>(useSWRConfig<CustomCache>().cache)
}

export function useCustomSWRConfig() {
  return (
    <>
      <SWRConfig value={null} />
      <SWRConfig value={undefined} />
      <SWRConfig value={() => ({})} />
      <SWRConfig value={() => null} />

      <SWRConfig
        // @ts-expect-error
        value={() => 0}
      />
    </>
  )
}
