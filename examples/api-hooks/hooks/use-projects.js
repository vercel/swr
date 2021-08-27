import useSWR from 'swr'

import fetch from '../libs/fetch'

export default function useProjects() {
  return useSWR('/api/data', fetch)
}

