import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const RemoteData = dynamic(() => import('../component/manual-retry-mutate'), {
  ssr: false
})

export default function HomePage() {
  return (
    <Suspense fallback={<div>loading component</div>}>
      <RemoteData></RemoteData>
    </Suspense>
  )
}
