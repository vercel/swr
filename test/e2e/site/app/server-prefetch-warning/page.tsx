'use client'

import { useEffect, useState } from 'react'
import useSWR, { SWRConfig } from 'swr'

const fetcher = () => 'SWR'

function Content() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  useSWR('ssr:1', fetcher)
  useSWR('ssr:2', fetcher)
  useSWR('ssr:3', fetcher, { strictServerPrefetchWarning: false })
  useSWR('ssr:4', fetcher, { fallbackData: 'SWR' })
  useSWR('ssr:5', fetcher)

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div data-testid="title">server-prefetch-warning</div>
      <div data-testid="hydration-state">{hydrated ? 'hydrated' : 'ssr'}</div>
    </div>
  )
}

export default function ServerPrefetchWarningPage() {
  return (
    <SWRConfig
      value={{
        strictServerPrefetchWarning: true,
        fallback: {
          'ssr:5': 'SWR'
        }
      }}
    >
      <Content />
    </SWRConfig>
  )
}
