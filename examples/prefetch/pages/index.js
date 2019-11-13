import React from 'react'
import Link from 'next/link'
import fetch from '../libs/fetch'

import useSWR, { mutate } from 'swr'

export default () => {
  const { data } = useSWR('/api/data', fetch)

  React.useEffect(() => {
    if (!data) return
    if (data.length === 0) return
    data.forEach(project => {
      fetch(`https://api.github.com/repos/${project}`)
        .then(projectData => {
          mutate(`/api/data?id=${project}`, projectData, false)
        })
    })
  }, [data]);

  return <div style={{ textAlign: 'center' }}>
    <h1>Trending Projects</h1>
    <div>
    {
      data ? data.map(project => 
        <p key={project}><Link href='/[user]/[repo]' as={`/${project}`}><a>{project}</a></Link></p>
      ) : 'loading...'
    }
    </div>
  </div>
}
