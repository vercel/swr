import React from 'react'
import Head from "next/head";
import Link from 'next/link'
import fetch from '../libs/fetch'

import useSWR, { mutate } from 'swr'

function prefetchData() {
  return fetch('/api/data')
    .then(data => {
      mutate('/api/data', data, false)
      return data
    })
}

function prefetchItem(project) {
  return fetch(`https://api.github.com/repos/${project}`).then(data => {
    mutate(`/api/data?id=${project}`, data, false)
    return data
  })
}

function prefetchWithProjects() {
  return prefetchData()
    .then(projects => Promise.all(projects.map(prefetchItem)))
}

// if we are on the browser trigger a prefetch as soon as possible
if (typeof window !== 'undefined') prefetchWithProjects()

export default function Index() {
  const { data } = useSWR('/api/data', fetch)

  // This effect will fetch all projects after mounting
  React.useEffect(() => {
    if (!data) return
    if (data.length === 0) return
    data.forEach(prefetchItem)
  }, [data]);

  // With this handler, you could prefetch the data for a specific
  // project the moment the user moves the mouse over the link
  function handleMouseEnter(event) {
    // In our case, we could get the ID from the href so we use that
    prefetchItem(event.target.getAttribute("href").slice(1))
  }

  return (
    <>
      <Head>
        {/* This will tell the browser to preload the data for our page */}
        <link preload="/api/data" as="fetch" crossOrigin="anonymous" />
      </Head>
      <div style={{ textAlign: 'center' }}>
        <h1>Trending Projects</h1>
        <div>
        {
          data ? data.map(project =>
            <p key={project}>
              <Link href='/[user]/[repo]' as={`/${project}`} onMouseEnter={handleMouseEnter}>
                {project}
              </Link>
            </p>
          ) : 'loading...'
        }
        </div>
      </div>
    </>
  )
}
