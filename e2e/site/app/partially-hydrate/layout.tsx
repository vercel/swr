'use client'
import type { PropsWithChildren } from 'react'
import { useDebugHistory } from '~/lib/use-debug-history'
import useData from './use-data'

export default function Layout({ children }: PropsWithChildren) {
  const { data } = useData()
  const debugRef = useDebugHistory(data, 'first history:')
  return (
    <html>
      <head />
      <body>
        <div>
          <div ref={debugRef}></div>
          <>first data:{data || 'undefined'}</>
        </div>
        {children}
      </body>
    </html>
  )
}
