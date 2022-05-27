import fetch from '../libs/fetch'
import useSWRAggregator from 'swr/aggregator'
import { useState } from 'react'

function Index() {
  const [keys, setKeys] = useState([
    '/api/data?id=0',
    '/api/data?id=1',
    '/api/data?id=2'
  ])
  const { data, items, mutate } = useSWRAggregator(keys, fetch, {
    keepPreviousData: true,
    children: (item, collection, index) => {
      
      console.log(
        'item data',
        item.data,
        item.error,
        item.isLoading,
        item.isValidating
      )
      return <div>{item.data ? item.data : 'loading'}</div>
    }
  })
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      <button
        onClick={() => setKeys(s => s.concat(`/api/data?id=${s.length}`))}
      >
        add
      </button>
      <div>{items}</div>
      <h2>-----***----</h2>
      <div onClick={() => mutate()}>
        {data ? (
          data.map(v => (
            <div key={v.key}>{v.data ? v.data : v.error.toString()}</div>
          ))
        ) : (
          <div>loading</div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return <Index></Index>
}
