'use client'

import { SWRConfig } from 'swr'

import fetcher from './libs/fetch'

declare module 'swr' {
  interface SWRGlobalConfig {
    suspense: true
  }
}

export function GlobalSWRConfig({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        suspense: true
      }}
    >
      {children}
    </SWRConfig>
  )
}
