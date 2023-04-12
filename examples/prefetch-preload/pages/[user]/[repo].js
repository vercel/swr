import Head from "next/head"
import Link from 'next/link'
import React from 'react'
import fetch from '../../libs/fetch'

import useSWR, { mutate } from 'swr'

function prefetchParent() {
  return fetch('/api/data')
    .then(projects => mutate('/api/data', projects, false))
}

// if we are on the browser trigger a prefetch as soon as possible
if (typeof window !== 'undefined') prefetchParent()

export default function Repo() {
  const id = typeof window !== 'undefined' ? window.location.pathname.slice(1) : ''
  const { data } = useSWR('/api/data?id=' + id, fetch)

  React.useEffect(() => {
    prefetchParent()
  }, [])

  function handleMouseEnter() {
    prefetchParent()
  }

  return (
    <>
      <Head>
        {/* This will tell the browser to preload the data for our page */}
        {id && <link preload={`/api/data?id=${id}`} as="fetch" crossOrigin="anonymous" />}
      </Head>
      <div style={{ textAlign: 'center' }}>
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
        <Link href="/" onMouseEnter={handleMouseEnter}>Back</Link>
      </div>
    </>
  )
}
