import React from 'react'
import Link from 'next/link'
import fetch from '../libs/fetch'

import useSWR, { mutate } from 'swr'

export default () => {
  const { data: projectsData } = useSWR('/api/data', fetch)

  React.useEffect(() => {
    if (!projectsData) return

    // for every project we have in our list:
    // - (pre)fetch its data (e.g. stars, watchers, ...)
    // - apply a local mutation containing this data
    Promise.all([
      projectsData.map(project =>
        fetch(`/api/data?id=${project}`).then(projectData =>
          mutate(`/api/data?id=${project}`, projectData)
        )
      )
    ]).catch(() => {
      // error when prefetching
    })
  }, [projectsData && projectsData.length])

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      <div>
        {projectsData
          ? projectsData.map(project => (
              <p key={project}>
                <Link href="/[user]/[repo]" as={`/${project}`}>
                  <a>{project}</a>
                </Link>
              </p>
            ))
          : 'loading...'}
      </div>
    </div>
  )
}
