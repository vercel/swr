import React from 'react'
import fetch from '../libs/fetch'

import useSWR, { mutate, trigger } from '@zeit/swr'

export default () => {
  const [text, setText] = React.useState('');
  const { data } = useSWR('/api/data', fetch)

  async function handleSubmit(event) {
    event.preventDefault()
    // mutate current data to optimistically update the UI
    // the fetch below could fail, in that case the UI will
    // be in an incorrect state
    mutate('/api/data', [...data, text], false)
    // send text to the API
    await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({ text })
    })
    // to revalidate the data and ensure is not incorrect
    // we trigger a revalidation of the data
    trigger('/api/data')
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
