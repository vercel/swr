import Link from 'next/link'
import fetch from '../libs/fetch'

import useSWR from 'swr'

export default () => {
  const { data } = useSWR('/api/data', fetch)

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
