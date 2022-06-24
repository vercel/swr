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
  const noNull = [
    // @ts-expect-error
    <SWRConfig key={'null'} value={null} />,
    // @ts-expect-error
    <SWRConfig key={'callback-return-null'} value={() => null} />
  ]

  return (
    <>
      {noNull}
      <SWRConfig value={undefined} />
      <SWRConfig value={() => ({})} />

      <SWRConfig
        // @ts-expect-error
        value={() => 0}
      />
    </>
  )
}
