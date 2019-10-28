import { useState } from 'react'
import Button from '../components/button'
import fetch from '../libs/fetch'

import useSWR from '@zeit/swr'

export default () => {
  const { data, revalidate } = useSWR('/api/data', fetch, {
    // revalidate the data per second
    refreshInterval: 1000
  })
  const [value, setValue] = useState('')

  if (!data) return <h1>loading...</h1>

  return (
    <div>
      <h1>Refetch Interval (1s)</h1>
      <h2>Todo List</h2>
      <form onSubmit={async ev => {
        ev.preventDefault()
        setValue('')
        await fetch(`/api/data?add=${value}`)
        revalidate()
      }}>
        <input placeholder='enter something' value={value} onChange={ev => setValue(ev.target.value)} />
      </form>
      <ul>
        {data.map(item => <li key={item}>{item}</li>)}
      </ul>
      <Button onClick={async () => {
        await fetch(`/api/data?clear=1`)
        revalidate()
      }}>Clear All</Button>
    </div>
  )
}
