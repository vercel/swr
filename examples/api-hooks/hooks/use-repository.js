import useSWR from 'swr'

import fetch from '../libs/fetch'

function useRepository(id) {
  return useSWR('/api/data?id=' + id, fetch)
}

export default useRepository
