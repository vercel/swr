'use client'

import { Suspense } from 'react'
import useSWR from 'swr'

export default function Page() {
  const { data, isLoading } = useSWR('/api/fallback-failed-promise')
  return (
    <Suspense fallback={<div>loading component</div>}>
      <div id="fallback-failed-promise">
        {isLoading ? 'loading...' : data?.value}
      </div>
    </Suspense>
  )
}
