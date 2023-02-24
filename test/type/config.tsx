import React from 'react'
import type { Cache, SWRResponse } from 'swr'
import useSWR, { useSWRConfig, SWRConfig } from 'swr'
import { expectType } from './utils'
import type {
  BareFetcher,
  FullConfiguration,
  PublicConfiguration
} from 'swr/_internal'
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

export function testSWRResponseCachedDataTypes() {
  type FilledData = SWRResponse<string, any, { suspense: true }>['data']
  expectType<Equal<FilledData, string>>(true)

  type FilledConditionalData = SWRResponse<
    string | number,
    any,
    { suspense: true }
  >['data']
  expectType<Equal<FilledConditionalData, string | number>>(true)
}

export function testSuspense() {
  // Basic
  const { data: data1 } = useSWR('/api', (k: string) => Promise.resolve(k), {
    suspense: true
  })
  expectType<string>(data1)

  // Basic(default fetcher)
  const { data: data2 } = useSWR('/api', {
    suspense: true
  })
  expectType<any>(data2)

  // Generics
  const { data: data3 } = useSWR<string>(
    '/api',
    (k: string) => Promise.resolve(k),
    { suspense: true }
  )
  expectType<string>(data3)

  // Generics(default fetcher)
  const { data: data4 } = useSWR<string>('/api', { suspense: true })
  expectType<string>(data4)

  // Generics(SWRKey)
  const { data: data5 } = useSWR<string, any, '/api'>(
    '/api',
    (k: string) => Promise.resolve(k),
    {
      suspense: true
    }
  )
  expectType<string>(data5)

  // Generics(SWRKey, default fetcher)
  const { data: data6 } = useSWR<string, any, '/api'>('/api', {
    suspense: true
  })
  expectType<string>(data6)
}

export function testFallbackData() {
  // Need to specify the type of Data returning from fetcher

  // Basic
  const fetcher1 = (k: string) => Promise.resolve(k)
  const { data: data1 } = useSWR('/api', fetcher1, {
    fallbackData: 'fallback'
  })
  expectType<string>(data1)

  // Conditional
  const fetcher2 = (k: string) =>
    Promise.resolve(Math.random() > 0.5 ? k : Math.random() * 100)
  const { data: data2 } = useSWR('/api', fetcher2, {
    fallbackData: 'fallback'
  })
  expectType<string | number>(data2)

  // Complex
  const fetcher3 = (k: string) => Promise.resolve({ value: k })
  const { data: data3 } = useSWR('/api', fetcher3, {
    fallbackData: { value: 'fallback' }
  })
  expectType<{ value: string }>(data3)

  // Does not need specific fetcher

  // Basic(default fetcher)
  const { data: data4 } = useSWR('/api', { fallbackData: 'fallback' })
  expectType<any>(data4)

  // Generics
  const { data: data5 } = useSWR<string>(
    '/api',
    (k: string) => Promise.resolve(k),
    { fallbackData: 'fallback' }
  )
  expectType<string>(data5)

  // Generics(default fetcher)
  const { data: data6 } = useSWR<string>('/api', { fallbackData: 'fallback' })
  expectType<string>(data6)

  // Generics(SWRKey)
  const { data: data7 } = useSWR<string, any, '/api'>(
    '/api',
    (k: string) => Promise.resolve(k),
    { fallbackData: 'fallback' }
  )
  expectType<string>(data7)

  // Generics(SWRKey, default fetcher)
  const { data: data8 } = useSWR<string, any, '/api'>('/api', {
    fallbackData: 'fallback'
  })
  expectType<string>(data8)
}
export function testUndefined() {
  // Undefined can be passed to config.
  expectType<
    Equal<
      Parameters<typeof useSWR<string, any>>['2'],
      Partial<PublicConfiguration<string, any, BareFetcher<string>>> | undefined
    >
  >(true)
}
