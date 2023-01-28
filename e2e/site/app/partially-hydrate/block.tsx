'use client'
import useSWR from 'swr'
import { useRef, useEffect } from 'react'
export default function Block() {
  const divRef = useRef<HTMLDivElement | null>(null)
  const { data } = useSWR<string>('/api/data', async url => {
    const res = await fetch(url).then(v => v.json())
    return res.name
  })
  const dataRef = useRef([data])
  useEffect(() => {
    if (dataRef.current[dataRef.current.length - 1] !== data) {
      dataRef.current.push(data)
    }
    if (divRef.current) {
      divRef.current.innerText = JSON.stringify(dataRef.current)
    }
  }, [data])

  return (
    <>
      <div ref={divRef} id="debug"></div>
      <div>result:{data || 'undefined'}</div>
    </>
  )
}
