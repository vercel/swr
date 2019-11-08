import fetch from '../libs/fetch'
import Link from 'next/link'

import useSWR, { useSWRPages } from 'swr'

export default () => {
  const {
    pages,
    isLoadingMore,
    isReachingEnd,
    loadMore
  } = useSWRPages(
    // page key
    'demo-page-2',

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

    // get next page's offset from the index of current page
    (SWR, index) => {
      // there's no next page
      if (SWR.data && SWR.data.length === 0) return null

      // offset = pageCount × pageSize
      return (index + 1) * 3
    },

    // deps of the page component
    []
  )

  return <div>
    <h1>Pagination (index as offset)</h1>
    {pages}
    <button onClick={loadMore} disabled={isReachingEnd || isLoadingMore}>
      {isLoadingMore ? '. . .' : isReachingEnd ? 'no more data' : 'load more'}
    </button>
    <hr />
    <Link href="/"><a>data offset based pagination →</a></Link><br />
    <Link href="/about"><a>go to another page →</a></Link>
  </div>
}
