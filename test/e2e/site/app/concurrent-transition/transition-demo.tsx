'use client'

import React, { useState, useTransition, Suspense, useCallback } from 'react'
import useSWR from 'swr'

// Simulate API data fetching with delay
const fetcher = async (key: string): Promise<string> => {
  // Slightly longer delay to make transition behavior more observable
  await new Promise(resolve => setTimeout(resolve, 150))
  return key
}

// Component that uses SWR with suspense
function DataComponent({ swrKey }: { swrKey: string }) {
  const { data } = useSWR(swrKey, fetcher, {
    dedupingInterval: 0,
    suspense: true,
    // React 19 improvements for concurrent features
    keepPreviousData: false
  })

  return <span data-testid="data-content">data:{data}</span>
}

export default function TransitionDemo() {
  const [isPending, startTransition] = useTransition()
  const [key, setKey] = useState('initial-key')

  const handleTransition = useCallback(() => {
    startTransition(() => {
      setKey('new-key')
    })
  }, [])

  return (
    <div>
      <h2>React 19 Concurrent Transition Demo</h2>
      <div
        onClick={handleTransition}
        data-testid="transition-trigger"
        style={{
          cursor: 'pointer',
          padding: '20px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: isPending ? '#f0f0f0' : '#fff'
        }}
      >
        <div data-testid="pending-state">isPending:{isPending ? '1' : '0'}</div>
        <Suspense
          fallback={<span data-testid="loading-fallback">loading</span>}
        >
          <DataComponent swrKey={key} />
        </Suspense>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Click to test concurrent transition behavior
        </p>
      </div>
    </div>
  )
}
