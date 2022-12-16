import React from 'react'
import type { Cache, SWRResponse } from 'swr'
import useSWR, { useSWRConfig, SWRConfig } from 'swr'
import { expectType } from './utils'
import type { FullConfiguration } from 'swr/_internal'
import type { Equal } from '@type-challenges/utils'

export function testCache() {
  expectType<Cache<any>>(useSWRConfig().cache)
}

export function testCustomSWRConfig() {
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

export function testFullConfiguration() {
  type IData = { value: string }
  type IError = { error: any }
  type IConfig = FullConfiguration<IData, IError>

  const config: IConfig = SWRConfig.defaultValue
  expectType<IData | undefined>(config.fallbackData)
}

export function testCachedkData() {
  type CachedSWRResponse = SWRResponse<string, any, true>
  type FilledData = CachedSWRResponse['data']
  expectType<Equal<FilledData, string>>(true)

  // Specify the type of Data returning from fetcher
  const fetcher = (k: string) => Promise.resolve(k)
  const { data: fulfilledData } = useSWR('/api', fetcher, {
    fallbackData: 'fallback'
  })
  const { data: suspenseyData } = useSWR(
    '/api',
    (k: string) => Promise.resolve(k),
    { suspense: true }
  )

  expectType<string>(fulfilledData)
  expectType<string>(suspenseyData)
}
