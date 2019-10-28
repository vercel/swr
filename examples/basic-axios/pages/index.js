import Link from 'next/link'
import axios from '../libs/axios'
import useSWR from '@zeit/swr'

export default () => {
  const { data } = useSWR('/api/data', axios)

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
