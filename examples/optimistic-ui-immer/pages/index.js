import React from 'react'
import fetch from '../libs/fetch'

import useSWR, { mutate } from 'swr'
import produce from "immer"

export default () => {
  const [text, setText] = React.useState('');
  const { data } = useSWR('/api/data', fetch)

  async function handleSubmit(event) {
    event.preventDefault()
    // call mutate to optimistically update the UI
    // we use Immer produce to allow us to perform and immutable change
    // while coding it as a normal mutation of the same object
    mutate("/api/data", produce(draftData => {
      draftData.push(text)
    }), false)
    // then we send the request to the API and let mutate
    // update the data with the API response
    // if this fail it will rollback the optimistic update
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
