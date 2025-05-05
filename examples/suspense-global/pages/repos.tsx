import Link from 'next/link'
import { ProjectsData } from './api/data'

import useSWR from 'swr'

const Repos = () => {
  const { data } = useSWR<ProjectsData>('/api/data')

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

export default Repos
