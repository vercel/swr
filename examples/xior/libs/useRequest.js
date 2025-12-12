import useSWR from 'swr'
import axios from 'xior'

export default function useRequest(request, { fallbackData, ...config } = {}) {
  return useSWR(
    request,
    () => axios.request(request || {}).then(response => response.data),
    {
      ...config,
      fallbackData: fallbackData && {
        status: 200,
        statusText: 'InitialData',
        headers: {},
        data: fallbackData
      }
    }
  ) 
}
