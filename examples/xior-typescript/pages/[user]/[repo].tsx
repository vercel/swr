import Link from 'next/link'

import useRequest from '../../libs/useRequest'

export default function Repo() {
  const id =
    typeof window !== 'undefined' ? window.location.pathname.slice(1) : ''
  const { data } = useRequest<{
    forks_count: number
    stargazers_count: number
    watchers: number
  }>({
    url: '/api/data',
    params: { id }
  })

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>{id}</h1>
      {data ? (
        <div>
          <p>forks: {data.forks_count}</p>
          <p>stars: {data.stargazers_count}</p>
          <p>watchers: {data.watchers}</p>
        </div>
      ) : (
        'loading...'
      )}
      <br />
      <br />
      <Link href="/">Back</Link>
    </div>
  )
}
