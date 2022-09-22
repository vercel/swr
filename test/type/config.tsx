import React from 'react'
import type { Cache } from 'swr'
import { useSWRConfig, SWRConfig } from 'swr'
import { expectType } from './utils'

export function useTestCache() {
  expectType<Cache<any>>(useSWRConfig().cache)
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
