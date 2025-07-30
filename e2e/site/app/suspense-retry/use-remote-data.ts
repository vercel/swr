'use client'
import useSWR from 'swr'
import { preload } from 'swr'

let count = 0
const fetcher = () => {
  count++
  if (count === 1) return Promise.reject('wrong')
  return fetch('/api/retry')
    .then(r => r.json())
    .then(r => r.name)
}

const key = 'manual-retry-18-3'

export const useRemoteData = () =>
  useSWR(key, fetcher, {
    suspense: true
  })

export const preloadRemote = () => preload(key, fetcher)
