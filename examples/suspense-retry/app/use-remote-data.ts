'use client'
import useSWR from 'swr'
import { preload } from 'swr'

let count = 0
const fetcher = () => {
  count++
  if (count === 1) return Promise.reject('wrong')
  return fetch('/api')
    .then(r => r.json())
    .then(r => r.data)
}

const key = 'manual-retry'

export const useRemoteData = () =>
  useSWR(key, fetcher, {
    suspense: true
  })

export const preloadRemote = () => preload(key, fetcher)
