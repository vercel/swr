import Link from 'next/link'
import fetch from '../libs/fetch'

import useSWR from 'swr'

export default function HomePage() {
  const { data } = useSWR<string[]>('/api/data', fetch)
  const { data: data2 } = useSWR(null, fetch)

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      {data2}
      <div>
        {data
          ? data.map(project => (
              <p key={project}>
                <Link href="/[user]/[repo]" as={`/${project}`}>
                  {project}
                </Link>
              </p>
            ))
          : 'loading...'}
      </div>
    </div>
  )
}
