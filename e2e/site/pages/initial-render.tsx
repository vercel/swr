import useSWR from 'swr'
import { Profiler } from 'react'

const useFetchUser = () =>
  useSWR(
    '/users/100',
    url =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(url)
        }, 1000)
      })
  )

function UserSWR() {
  useFetchUser()
  return <div>SWRTest</div>
}

export default function SWRTest() {
  return (
    <Profiler
      id="swr"
      onRender={() => {
        ;(window as any).onRender('UserSWR rendered')
      }}
    >
      <UserSWR />
    </Profiler>
  )
}
