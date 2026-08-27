import { SWRConfig } from 'swr'

function createPromiseData(data: any, timeout: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data)
    }, timeout)
  })
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const fallback = {
    '/api/promise': createPromiseData({ value: 'async promise' }, 2000)
  }

  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>
}
