import React from 'react'
import type { Cache } from 'swr'
import useSWR, { useSWRConfig, SWRConfig } from 'swr'
import { expectType } from './utils'
import type { FullConfiguration } from 'swr/_internal'
import type { Equal } from '@type-challenges/utils'

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

export function useFullConfiguration() {
  type IData = { value: string }
  type IError = { error: any }
  type IConfig = FullConfiguration<IData, IError>

  const config: IConfig = SWRConfig.defaultValue
  expectType<IData | undefined>(config.fallbackData)
}

export function useTestSuspense() {
  const { data: suspenseyData } = useSWR(
    '/api',
    (k: string) => Promise.resolve(k),
    { suspense: true }
  )

  expectType<Equal<string, typeof suspenseyData>>(true)
}

export function useTestFallbackData() {
  // Need to specify the type of Data returning from fetcher

  // Basic
  const fetcher1 = (k: string) => Promise.resolve(k)
  const { data: data1 } = useSWR('/api', fetcher1, {
    fallbackData: 'fallback'
  })
  expectType<Equal<string, typeof data1>>(true)

  // Conditional
  const fetcher2 = (k: string) =>
    Promise.resolve(Math.random() > 0.5 ? k : Math.random() * 100)
  const { data: data2 } = useSWR('/api', fetcher2, {
    fallbackData: 'fallback'
  })
  expectType<Equal<string | number, typeof data2>>(true)

  // Complex
  const fetcher3 = (k: string) => Promise.resolve({ value: k })
  const { data: data3 } = useSWR('/api', fetcher3, {
    fallbackData: { value: 'fallback' }
  })
  expectType<Equal<{ value: string }, typeof data3>>(true)
}
