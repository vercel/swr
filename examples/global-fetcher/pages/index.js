import Link from 'next/link'

import useSWR from 'swr'

export default function Index() {
  const { data } = useSWR('/api/data')

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
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
