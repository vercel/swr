import useSWR from 'swr'

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

export default function UserSWR() {
  useFetchUser()
  console.log('UserSWR rendered')
  return <div>SWRTest</div>
}
