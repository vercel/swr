'use client'

import { Suspense } from 'react'
import useSWR from 'swr'

const fetcher = () => 'SWR'

function PageContent() {
  const { data } = useSWR('render-suspense-initial-data', fetcher, {
    fallbackData: 'Initial',
    suspense: true
  })

  return <div data-testid="data">hello, {data}</div>
}

export default function Page() {
  return (
    <Suspense fallback={<div data-testid="fallback">fallback</div>}>
      <PageContent />
    </Suspense>
  )
}
