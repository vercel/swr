'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const TransitionDemo = dynamic(() => import('./transition-demo'), {
  ssr: false
})

export default function ConcurrentTransitionPage() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>React 19 Concurrent Transition Test</h1>
      <p>
        This page tests SWR&apos;s behavior with React 19 concurrent
        transitions. When using useTransition, SWR should &quot;pause&quot;
        loading states to provide smooth UX.
      </p>
      <Suspense fallback={<div>Loading page...</div>}>
        <TransitionDemo />
      </Suspense>
    </div>
  )
}
