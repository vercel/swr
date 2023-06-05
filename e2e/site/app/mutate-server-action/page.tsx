'use client'
import useSWRMutation from 'swr/mutation'
import { action } from './action'

const useServerActionMutation = () =>
  useSWRMutation('/api/mutate-server-action', () => action())

const Page = () => {
  const { trigger, data, isMutating } = useServerActionMutation()
  return (
    <div>
      <button onClick={() => trigger()}>mutate</button>
      <div>isMutating: {isMutating.toString()}</div>
      <div>data: {data?.result}</div>
    </div>
  )
}

export default Page
