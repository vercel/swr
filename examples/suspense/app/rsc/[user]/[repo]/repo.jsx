'use client'
import fetcher from '../../../../libs/fetch'
import useSWR from 'swr'

const Repo = ({ id, serverData }) => {
  const { data } = useSWR('/api/data?id=' + id, fetcher, { suspense: true, fallbackData: serverData })
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

export default Repo