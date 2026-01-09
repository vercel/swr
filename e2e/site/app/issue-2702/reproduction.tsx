'use client'
import useSWR, { preload } from 'swr'
import { Suspense, use, useEffect, useState } from 'react'

const sleep = (time: number, data: string) =>
  new Promise<string>(resolve => {
    setTimeout(() => resolve(data), time)
  })

const Bug = () => {
  const a = use(preload('a', () => sleep(1000, 'a')))
  const { data: b } = useSWR('b', () => sleep(2000, 'b'), {
    suspense: true
  })
  useState(b)
  return (
    <div>
      {a},{b}
    </div>
  )
}

const Comp = () => {
  const [loading, setLoading] = useState(true)

  // To prevent SSR
  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return <span>Loading...</span>
  }
  return (
    <Suspense fallback={<div>fetching</div>}>
      <Bug></Bug>
    </Suspense>
  )
}

export default Comp
