import React from 'react'
import type { Cache } from 'swr'
import { useSWRConfig, SWRConfig } from 'swr'
import { expectType } from './utils'
import type { FullConfiguration } from 'swr/_internal'

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
