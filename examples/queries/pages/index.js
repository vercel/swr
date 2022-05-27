import fetch from '../libs/fetch'
import useSWRList from 'swr/list'
import useSWR from 'swr'
import { Profiler, useState } from 'react'
const RenderMore = () => {
  const [keys, setKeys] = useState([
    '/api/data?id=0'
  ])
  const { result } = useSWRList(keys, fetch)
  return (
    <div>
      <button
        onClick={() =>
          setKeys(s => s.concat(`/api/data?id=${s.length}`))
        }
      >
        add
      </button>
      {result.map(v => (
        <div key={v.key}>{v.data ? v.data : 'loading'}</div>
      ))}
    </div>
  )
}

const RenderLess = () => {
  const { data, mutate } = useSWRList(
    ['/api/data?id=0', '/api/data?id=1', '/api/data?id=2'],
    fetch
  )
  return data ? (
    data.map(v => <div key={v.key}>{v.data ? v.data : v.error}</div>)
  ) : (
    <div>loading</div>
  )
}

const Proposal1 = () => {
  const { result } = useSWRList(
    ['/api/data?id=0', '/api/data?id=1', '/api/data?id=2'],
    fetch
  )
  console.group('Proposal1')
  console.log('Proposal1')
  console.log('result', result)
  console.groupEnd('Proposal1')
  return null
}

const Proposal2 = () => {
  const { data, isLoading, isValidating } = useSWRList(
    ['/api/data?id=0', '/api/data?id=1', '/api/data?id=2'],
    fetch
  )
  console.group('Proposal2')
  console.log('Proposal2')
  console.log('data', data)
  console.log('isLoading', isLoading)
  console.log('isValidating', isValidating)
  console.groupEnd('Proposal2')
  return null
}

export default function Index() {
  useSWR('/api/data?id=0', (_) => {
    console.log('fire')
    fetch(_)
  })
  useSWR('/api/data?id=1', fetch)
  useSWR('/api/data?id=2', fetch)
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Trending Projects</h1>
      <div>
        <h2>Proposal 1</h2>
        {/* <Proposal1></Proposal1> */}
        <Profiler id="rendermore">
          <RenderMore></RenderMore>
        </Profiler>
      </div>
      <div>
        <h2>Proposal 2</h2>
        {/*<Proposal2></Proposal2>*/}
        <Profiler id="renderless">
          <RenderLess></RenderLess>
        </Profiler>
      </div>
    </div>
  )
}
