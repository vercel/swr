import React from 'react'
import fetch from '../libs/fetch'

import useSWR, { mutate } from '@zeit/swr'

export default () => {
  const [text, setText] = React.useState('');
  const { data } = useSWR('/api/data', fetch)

  async function handleSubmit(event) {
    event.preventDefault()
    // send text to the API
    await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({ text })
    })
    // mutate current data to optimistically update the UI
    // the above fetch could fail, in that case the UI will
    // return to the previous state after SWR revalidate it
    mutate('/api/data', [...data, text])
    setText('')
  }

  return <div>
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={event => setText(event.target.value)}
        value={text}
      />
      <button>Create</button>
    </form>
    <ul>
      {data ? data.map(datum => <li key={datum}>{datum}</li>) : 'loading...'}
    </ul>
  </div>
}
