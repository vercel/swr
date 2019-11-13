import React from 'react'
import Link from 'next/link'
import fetch from '../../libs/fetch'

import useSWR, { mutate } from 'swr'

export default () => {
  const id = typeof window !== 'undefined' ? window.location.pathname.slice(1) : ''
  const { data } = useSWR('/api/data?id=' + id, fetch)

  React.useEffect(() => {
    fetch('/api/data')
      .then(projects => mutate('/api/data', projects, false))
  }, []);

  return <div style={{ textAlign: 'center' }}>
    <h1>{id}</h1>
    {
      data ? <div>
        <p>forks: {data.forks_count}</p>
        <p>stars: {data.stargazers_count}</p>
        <p>watchers: {data.watchers}</p>
      </div> : 'loading...'
    }
    <br />
    <br />
    <Link href="/"><a>Back</a></Link>
  </div>
}
