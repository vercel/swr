import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import useSWR from 'swr'
import { mutate } from 'swr'

let count = 0
export const fetcher = () => {
  count++
  if (count === 1) return Promise.reject('wrong')
  return fetch('/api/retry')
    .then(r => r.json())
    .then(r => r.name)
}

const key = 'manual-retry-mutate'

export const useRemoteData = () =>
  useSWR(key, fetcher, {
    suspense: true
  })
const Demo = () => {
  const { data } = useRemoteData()
  return <div>data: {data}</div>
}

function Fallback({ resetErrorBoundary }: any) {
  return (
    <div role="alert">
      <p>Something went wrong</p>
      <button
        onClick={async () => {
          await mutate(key, fetcher)
          resetErrorBoundary()
        }}
      >
        retry
      </button>
    </div>
  )
}

function RemoteData() {
  return (
    <div className="App">
      <ErrorBoundary FallbackComponent={Fallback}>
        <Suspense fallback={<div>loading</div>}>
          <Demo />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

export default RemoteData
