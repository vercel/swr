import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Suspense } from 'react'
import ErrorHandling from '../../components/error-handling'
import { useRouter } from 'next/router'

const Detail = dynamic(() => import('./detail'), {
  ssr: false
})

export default function Repo() {
  const router = useRouter()
  if (!router.isReady) return null
  const { user, repo } = router.query
  const id = `${user}/${repo}`

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>{id}</h1>
      <Suspense fallback={<div>loading...</div>}>
        <ErrorHandling fallback={<div>oooops!</div>}>
          <Detail id={id}></Detail>
        </ErrorHandling>
      </Suspense>
      <br />
      <br />
      <Link href="/">Back</Link>
    </div>
  )
}
