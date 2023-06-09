'use client'
import { Suspense, useState } from 'react'
import useSWR from 'swr'
import { preload } from 'swr'

const fetcher = ([key, delay]: [key: string, delay: number]) =>
  new Promise<string>(r => {
    setTimeout(r, delay, key)
  })

const key = ['suspense-after-preload', 300] as const
const useRemoteData = () =>
  useSWR(key, fetcher, {
    suspense: true
  })

const Demo = () => {
  const { data } = useRemoteData()
  return <div>{data}</div>
}

function Comp() {
  const [show, toggle] = useState(false)

  return (
    <div className="App">
      <button
        onClick={async () => {
          preload(key, fetcher)
          toggle(!show)
        }}
      >
        preload
      </button>
      {show ? (
        <Suspense fallback={<div>loading</div>}>
          <Demo />
        </Suspense>
      ) : null}
    </div>
  )
}

export default Comp
