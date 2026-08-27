'use client'

import useSWR from 'swr'

export default function Page() {
  const { data, isLoading } = useSWR('/api/promise')

  return <div>{isLoading ? 'loading...' : data?.value}</div>
}
