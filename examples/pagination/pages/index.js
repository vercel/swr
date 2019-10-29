import fetch from '../libs/fetch'
import Link from 'next/link'

import useSWR, { useSWRPages } from '@zeit/swr'

export default () => {
  const {
    pages,
    isLoadingMore,
    isReachingEnd,
    loadMore
  } = useSWRPages(
    // page key
    'demo-page',

    // page component
    ({ offset, withSWR }) => {
      const { data: projects } = withSWR(
        // use the wrapper to wrap the *pagination API SWR*
        useSWR('/api/projects?offset=' + (offset || 0), fetch)
      )
      // you can still use other SWRs outside

      if (!projects) {
        return <p>loading</p>
      }

      return projects.map(project => 
        <p key={project.id}>{project.name}</p>
      )
    },

    // one page's SWR data => offset of next page
    projects =>
      projects && projects.length
        ? projects[projects.length - 1].id + 1
        : null,

    // deps of the page component
    []
  )

  return <div>
    <h1>Pagination</h1>
    {pages}
    <button onClick={loadMore} disabled={isReachingEnd || isLoadingMore}>
      {isLoadingMore ? '. . .' : isReachingEnd ? 'no more data' : 'load more'}
    </button>
    <hr />
    <Link href="/about"><a>go to another page</a></Link>
  </div>
}
