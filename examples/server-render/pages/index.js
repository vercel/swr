import Link from 'next/link'
import fetcher from '../libs/fetcher'

import useSWR from 'swr'

export default function Home({ initialData }) {
  const { data } = useSWR('/api/data', fetcher, { initialData })

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

Home.getInitialProps = async () => {
  const data = await fetcher('http://localhost:3000/api/data')
  return { initialData: data }
}
