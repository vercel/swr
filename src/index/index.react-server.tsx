import React from 'react'
import { type ComponentProps } from 'react'
import { SWRConfig as SWRConfigClient } from './config'
import type { Key } from '../_internal'
import { serialize } from '../_internal/index.react-server'

const isPromise = (value: any) => {
  return value && typeof value.then === 'function'
}

const isFunction = (value: any): value is Function => {
  return typeof value === 'function'
}

export const unstable_serialize = (key: Key) => serialize(key)[0]

export function SWRConfig(props: ComponentProps<typeof SWRConfigClient>) {
  const { value } = props
  const normalizedConfig = isFunction(value) ? value() : value

  const fallbackMap: {
    [key: string]: any
  } = normalizedConfig?.fallback || {}
  if (normalizedConfig?.fallback) {
    for (const key in normalizedConfig.fallback) {
      const fallbackData = normalizedConfig.fallback[key]
      if (isPromise(fallbackData)) {
        fallbackMap[key] = fallbackData.catch(() => {})
      }
    }
  }

  return (
    <SWRConfigClient
      value={{
        ...normalizedConfig,
        fallback: fallbackMap
      }}
    />
  )
}
