import Link from 'next/link'

export default () => {
  return <>
    <p>When navigating between pages, SWR will recover the pages you've loaded.</p>
    <Link href="/"><a>back</a></Link>
  </>
}