import { Suspense } from 'react'
import Link from 'next/link'
import fetcher from '../libs/fetch';

import useSWR from 'swr'

const isServer = typeof window === 'undefined'

const Repos = () => {
  const { data } = useSWR('/api/data', fetcher, { suspense: true })

  return (
    <>
      {data.map(project => (
        <p key={project}>
          <Link href="/[user]/[repo]" as={`/${project}`}>
            <a>{project}</a>
          </Link>
        </p>
      ))}
    </>
  )
}

export default function Index() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      {!isServer ? (
        <Suspense fallback={<div>loading...</div>}>
          <Repos></Repos>
        </Suspense>
      ) : null}
    </div>
  )
}
