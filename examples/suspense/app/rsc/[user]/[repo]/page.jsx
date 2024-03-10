import Repo from './repo'
import fetcher from '../../../../libs/fetch'
import Link from 'next/link'
import { Suspense } from 'react'
const Page = ({ params }) => {
  const { user, repo } = params
  const id = `${user}/${repo}`
  const serverData = fetcher('http://localhost:3000/api/data?id=' + id)
  return (
    <div>
      <div>Repo: {id}</div>
      <Suspense fallback={<div>Loading stats</div>}>
        <Repo serverData={serverData} id={id} />
      </Suspense>
      <br />
      <br />
      <Link href="/rsc">Back</Link>
    </div>
  )
}


export default Page