import { Suspense } from 'react'
import Link from 'next/link'
import fetcher from '../../libs/fetch'
import ErrorHandling from '../../components/error-handling'

import useSWR from 'swr'

const isServer = typeof window === 'undefined'

const Detail = ({ id }) => {
  const { data } = useSWR('/api/data?id=' + id, fetcher, { suspense: true })

  return (
    <>
      {data ? (
        <div>
          <p>forks: {data.forks_count}</p>
          <p>stars: {data.stargazers_count}</p>
          <p>watchers: {data.watchers}</p>
        </div>
      ) : null}
    </>
  )
}

export default function Repo() {
  const id =
    typeof window !== 'undefined' ? window.location.pathname.slice(1) : ''

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>{id}</h1>
      {!isServer ? (
        <Suspense fallback={<div>loading...</div>}>
          <ErrorHandling fallback={<div>oooops!</div>}>
            <Detail id={id}></Detail>
          </ErrorHandling>
        </Suspense>
      ) : null}
      <br />
      <br />
      <Link href="/">
        <a>Back</a>
      </Link>
    </div>
  )
}
