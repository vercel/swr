import useSWR from 'swr'
import { RepoData } from '../api/data'

const Detail = ({ id }: { id: string }) => {
  const { data } = useSWR<RepoData>('/api/data?id=' + id)

  return (
    <>
      {data ? (
        <div>
          <p>forks: {data.forks_count}</p>
          <p>stars: {data.stargazers_count}</p>
          <p>watchers: {data.watchers}</p>
        </div>
      ) : null}
    </>
  )
}

export default Detail
