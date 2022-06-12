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
  // @ts-expect-error
  const nullElement = <SWRConfig value={null} />

  // @ts-expect-error
  const functionalNullElement = <SWRConfig value={() => null} />
  return (
    <>
      <SWRConfig value={() => ({})} />
      <SWRConfig value={undefined} />

      {/* null is not acceptable */}
      {nullElement}
      {functionalNullElement}
    </>
  )
}
