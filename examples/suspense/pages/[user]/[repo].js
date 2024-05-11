import { Suspense } from 'react'
import Link from 'next/link'
import fetcher from '../../libs/fetch'
import ErrorHandling from '../../components/error-handling'
import useSWR from 'swr'

const Detail = ({ id, serverData }) => {
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

export default function Repo({ id, serverData }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>{id}</h1>
      <Suspense fallback={<div>loading...</div>}>
        <ErrorHandling fallback={<div>oooops!</div>}>
          <Detail id={id} serverData={serverData}></Detail>
        </ErrorHandling>
      </Suspense>
      <br />
      <br />
      <Link href="/">Back</Link>
    </div>
  )
}

export const getServerSideProps = async ({ params }) => {
  const { user, repo } = params
  const id = `${user}/${repo}`
  const data = await fetcher('http://localhost:3000/api/data?id=' + id).catch(() => {})
  return { props: { serverData: data, id } }
}