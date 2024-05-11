import { Suspense } from 'react'
import Link from 'next/link'
import fetcher from '../libs/fetch'

import useSWR from 'swr'

const Repos = ({ serverData }) => {
  const { data } = useSWR('/api/data', fetcher, {
    suspense: true,
    fallbackData: serverData
  })

  return (
    <>
      {data.map(project => (
        <p key={project}>
          <Link href="/[user]/[repo]" as={`/${project}`}>
            {project}
          </Link>
        </p>
      ))}
    </>
  )
}

export default function Index({ serverData }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      <Suspense fallback={<div>loading...</div>}>
        <Repos serverData={serverData}></Repos>
      </Suspense>
    </div>
  )
}

export const getServerSideProps = async () => {
  const data = await fetcher('http://localhost:3000/api/data')
  return { props: { serverData: data } }
}
