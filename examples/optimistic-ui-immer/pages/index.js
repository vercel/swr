import React from 'react'
import fetch from '../libs/fetch'

import useSWR, { mutate } from 'swr'
import produce from "immer"

export default function Index() {
  const [text, setText] = React.useState('');
  const { data } = useSWR('/api/data', fetch)

  async function handleSubmit(event) {
    event.preventDefault()
    // Call mutate to optimistically update the UI.
    // We use Immer produce to allow us to perform an immutable change
    // while coding it as a normal mutation of the same object.
    mutate("/api/data", produce(draftData => {
      draftData.push(text)
    }), false)
    // Then we send the request to the API and let mutate
    // update the data with the API response.
    // Our action may fail in the API function, and the response differ
    // from what was optimistically updated, in that case the UI will be
    // changed to match the API response.
    // The fetch could also fail, in that case the UI will
    // be in an incorrect state until the next successful fetch.
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
