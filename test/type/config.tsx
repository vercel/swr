import React from 'react'
import type { Cache, SWRResponse } from 'swr'
import useSWR, { useSWRConfig, SWRConfig } from 'swr'
import { expectType } from './utils'
import type { FullConfiguration, SWRConfiguration } from 'swr/_internal'
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

  // If a generic is explicitly passed we will lose type inference for the swr config
  // because of partial inference limitations in typescript.
  // https://github.com/microsoft/TypeScript/issues/26242
  const { data: data3 } = useSWR<string>(
    '/api',
    (k: string) => Promise.resolve(k),
    { suspense: true }
  )
  expectType<string | undefined>(data3)

  const { data: data4 } = useSWR<string, any, { suspense: true }>(
    '/api',
    (k: string) => Promise.resolve(k),
    { suspense: true }
  )
  expectType<string>(data4)
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

  // If a generic is explicitly passed we will lose type inference for the swr config
  // because of partial inference limitations in typescript.
  // https://github.com/microsoft/TypeScript/issues/26242
  const { data: data5 } = useSWR<string>(
    '/api',
    (k: string) => Promise.resolve(k),
    { fallbackData: 'fallback' }
  )
  expectType<string | undefined>(data5)

  const { data: data6 } = useSWR<string, any, { fallbackData: 'fallback' }>(
    '/api',
    (k: string) => Promise.resolve(k),
    { fallbackData: 'fallback' }
  )
  expectType<string>(data6)
}

export function testConfigAsSWRConfiguration() {
  const fetcher = (k: string) => Promise.resolve({ value: k })
  const { data } = useSWR('/api', fetcher, {} as SWRConfiguration)
  expectType<Equal<typeof data, { value: string } | undefined>>(true)
}

export function testEmptyConfig() {
  const fetcher = (k: string) => Promise.resolve({ value: k })
  const { data, error, isLoading } = useSWR<{ value: string }, Error>(
    '/api',
    fetcher,
    {}
  )
  expectType<Equal<typeof data, { value: string } | undefined>>(true)
  expectType<Equal<typeof error, Error | undefined>>(true)
  expectType<Equal<typeof isLoading, boolean>>(true)
}
