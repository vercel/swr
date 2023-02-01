import useSWR from 'swr'
export default function useData() {
  return useSWR<string>('/api/data', async url => {
    const res = await fetch(url).then(v => v.json())
    return res.name
  })
}
