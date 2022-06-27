import useSWR from 'swr'
import React, { useState } from 'react'

import fetch from '../libs/fetch'

export default function App() {
  const [text, setText] = useState('')
  const { data, mutate } = useSWR('/api/todos', fetch)

  const [state, setState] = useState(<span className="info">&nbsp;</span>)

  return (
    <div>
      {/* <Toaster toastOptions={{ position: 'bottom-center' }} /> */}
      <h1>Optimistic UI with SWR</h1>

      <p className="note">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm1 18h-2v-8h2v8zm-1-12.25c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25.56-1.25 1.25-1.25z" />
        </svg>
        This application optimistically updates the data, while revalidating in
        the background. The <code>POST</code> API auto capitializes the data,
        and only returns the new added one instead of the full list. And the{' '}
        <code>GET</code> API returns the full list in order.
      </p>

      <form onSubmit={ev => ev.preventDefault()}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add your to-do here..."
          autoFocus
        />
        <button
          type="submit"
          onClick={async () => {
            setText('')
            setState(
              <span className="info">Showing optimistic data, mutating...</span>
            )

            const newTodo = {
              id: Date.now(),
              text
            }

            try {
              // Update the local state immediately and fire the
              // request. Since the API will return the updated
              // data, there is no need to start a new revalidation
              // and we can directly populate the cache.
              await mutate(
                fetch('/api/todos', {
                  method: 'POST',
                  body: JSON.stringify(newTodo)
                }),
                {
                  optimisticData: [...data, newTodo],
                  rollbackOnError: true,
                  populateCache: newItem => {
                    setState(
                      <span className="success">
                        Successfully mutated the resource and populated cache.
                        Revalidating...
                      </span>
                    )

                    return [...data, newItem]
                  },
                  revalidate: true
                }
              )
              setState(<span className="info">Revalidated the resource.</span>)
            } catch (e) {
              // If the API errors, the original data will be
              // rolled back by SWR automatically.
              setState(
                <span className="error">
                  Failed to mutate. Rolled back to previous state and
                  revalidated the resource.
                </span>
              )
            }
          }}
        >
          Add
        </button>
      </form>

      {state}

      <ul>
        {data ? (
          data.length ? (
            data.map(todo => {
              return <li key={todo.id}>{todo.text}</li>
            })
          ) : (
            <i>
              No todos yet. Try adding lowercased "banana" and "apple" to the
              list.
            </i>
          )
        ) : (
          <i>Loading...</i>
        )}
      </ul>
    </div>
  )
}
