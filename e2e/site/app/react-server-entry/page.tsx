import { unstable_serialize } from 'swr'
import { unstable_serialize as infinite_unstable_serialize } from 'swr/infinite'

export default function Page() {
  return (
    <>
      <div>SWR Server Component entry test</div>
      <div>unstable_serialize: {unstable_serialize('useSWR')}</div>
      <div>
        infinite_unstable_serialize:{' '}
        {infinite_unstable_serialize(() => 'useSWRInfinite')}
      </div>
    </>
  )
}
