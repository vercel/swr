import React, { type PropsWithChildren, StrictMode } from 'react'
import { SWRConfig } from 'swr'

const ProviderWithConfig = ({
  children,
  value
}: PropsWithChildren<{ value: Parameters<typeof SWRConfig>[0]['value'] }>) => {
  return (
    <StrictMode>
      <SWRConfig value={value}>{children}</SWRConfig>
    </StrictMode>
  )
}

export const Provider = ({
  children,
  value
}: PropsWithChildren<{ value?: Parameters<typeof SWRConfig>[0]['value'] }>) => {
  const provider = () => new Map()
  return (
    <ProviderWithConfig value={{ ...value, provider }}>
      {children}
    </ProviderWithConfig>
  )
}

export const ProviderWithGlobalCache = ({
  children,
  value
}: PropsWithChildren<{ value: Parameters<typeof SWRConfig>[0]['value'] }>) => {
  return <ProviderWithConfig value={value}>{children}</ProviderWithConfig>
}
