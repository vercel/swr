import useSWR from 'swr'

export default function useData() {
  return useSWR<string>('/api/data', async (url: string) => {
    const res = await fetch(url).then(v => v.json())
    return res.name
  })
}
