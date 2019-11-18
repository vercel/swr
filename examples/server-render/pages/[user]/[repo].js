import Link from 'next/link'
import fetcher from '../../libs/fetcher'

import useSWR from 'swr'

export default function Repository({ id, initialData }) {
  const { data } = useSWR('/api/data?id=' + id, fetcher, { initialData })

  return <div style={{ textAlign: 'center' }}>
    <h1>{id}</h1>
    {
      data ? <div>
        <p>forks: {data.forks_count}</p>
        <p>stars: {data.stargazers_count}</p>
        <p>watchers: {data.watchers}</p>
      </div> : 'loading...'
    }
    <br />
    <br />
    <Link href="/"><a>Back</a></Link>
  </div>
}

Repository.getInitialProps = async ({ query }) => {
  const id = `${query.user}/${query.repo}`;
  const data = await fetcher(`http://localhost:3000/api/data?id=${id}`)
  return { initialData: data, id }
}
