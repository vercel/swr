import useSWR from 'swr'

import fetch from '../libs/fetch'

export default function useRepository(id) {
  return useSWR('/api/data?id=' + id, fetch)
}
