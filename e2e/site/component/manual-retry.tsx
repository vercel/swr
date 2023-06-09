import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useRemoteData, preloadRemote } from './use-remote-data'

const Demo = () => {
  const { data } = useRemoteData()
  return <div>data: {data}</div>
}

function Fallback({ resetErrorBoundary }: any) {
  return (
    <div role="alert">
      <p>Something went wrong</p>
      <button
        onClick={() => {
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
      <ErrorBoundary
        FallbackComponent={Fallback}
        onReset={() => {
          preloadRemote()
        }}
      >
        <Suspense fallback={<div>loading</div>}>
          <Demo />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

export default RemoteData
