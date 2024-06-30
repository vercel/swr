import { Suspense } from 'react'
import { SWRConfig } from 'swr'

function createPromiseData(data: any, timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data instanceof Error) {
        reject(data)
      } else {
        resolve(data)
      }
    }, timeout)
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const fallback = {
    '/api/fallback-failed-promise': createPromiseData(
      new Error('rejected error'),
      2000
    )
  }

  return (
    <SWRConfig value={{ fallback }}>
      <Suspense fallback={<p>loading...</p>}>{children}</Suspense>
    </SWRConfig>
  )
}
