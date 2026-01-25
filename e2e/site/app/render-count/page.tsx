'use client'
import useSWR from 'swr'

export default function Page() {
  useSWR('swr should not cause extra rerenders')
  console.count('render')
  return <div>render count pages</div>
}
