import React, { type PropsWithChildren } from 'react'
import { SWRConfig } from 'swr'

const Provider = ({ children }: PropsWithChildren<any>) => {
  return <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
}
export default Provider
