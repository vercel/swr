import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const Repos = dynamic(() => import('./repos'), {
  ssr: false
})

export default function Index() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      <Suspense fallback={<div>loading...</div>}>
        <Repos />
      </Suspense>
    </div>
  )
}
