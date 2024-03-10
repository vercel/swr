'use client'
import useSWR from 'swr'
import fetcher from '../../libs/fetch'
import Link from 'next/link'

const Repos = ({ serverData }) => {
  const { data } = useSWR('/api/data', fetcher, {
    suspense: true,
    fallbackData: serverData
  })
  return (
    <>
      {data.map(project => (
        <p key={project}>
          <Link href={`/rsc/${project}`}>
            {project}
          </Link>
        </p>
      ))}
    </>
  )
}

export default Repos