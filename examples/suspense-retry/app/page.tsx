import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const RemoteData = dynamic(() => import('./manual-retry'), {
  ssr: false
})

export default function HomePage() {
  return (
    <Suspense fallback={<div>loading component</div>}>
      <RemoteData></RemoteData>
    </Suspense>
  )
}
