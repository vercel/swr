import React from 'react'
import fetch from '../libs/fetch'

import useSWR, { mutate } from 'swr'

export default () => {
  const [text, setText] = React.useState('');
  const { data } = useSWR('/api/data', fetch)

  async function handleSubmit(event) {
    event.preventDefault()
    // mutate current data to optimistically update the UI
    // the fetch below could fail, in that case the UI will
    // be in an incorrect state
    mutate('/api/data', [...data, text], false)
    // then we send the request to the API and let mutate
    // update the data with the API response
    mutate('/api/data', await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({ text })
    }))
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
