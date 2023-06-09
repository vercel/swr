'use client'
import { Suspense, useState, Profiler } from 'react'
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
          await preload(key, fetcher)
          toggle(!show)
        }}
      >
        preload
      </button>
      {show ? (
        <Suspense
          fallback={
            <Profiler
              id={key[0]}
              onRender={() => {
                ;(window as any).onRender('render')
              }}
            >
              <div>loading</div>
            </Profiler>
          }
        >
          <Demo />
        </Suspense>
      ) : null}
    </div>
  )
}

export default Comp
