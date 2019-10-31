import useSWR from 'swr'

import fetch from '../libs/fetch'

function useProjects() {
  return useSWR('/api/data', fetch)
}

export default useProjects
