import React from 'react'
import useSWRList from 'swr/list'
import { screen } from '@testing-library/react'
import { createKey, createResponse, renderWithConfig } from './utils'

describe('useSWRList', () => {
  it('should correctly load a single key', async () => {
    const key = createKey()
    function Page() {
      const [{ data, error, isValidating }] = useSWRList([key], itemKey =>
        createResponse(itemKey)
      )

      return (
        <div>
          <div>data:{data}</div>
          <div>error:{error}</div>
          <div>isValidating:{isValidating.toString()}</div>
        </div>
      )
    }

    renderWithConfig(<Page />)
    screen.getByText('data:')

    await screen.findByText(`data:${key}`)
    await screen.findByText(`error:`)
    await screen.findByText(`isValidating:false`)
  })

  it('should correctly load a multiple keys', async () => {
    const key1 = createKey()
    const key2 = createKey()
    function Page() {
      const results = useSWRList([key1, key2], itemKey =>
        createResponse(itemKey)
      )

      return (
        <div>
          {results.map(({ data, error, isValidating }, index) => (
            <div key={index}>
              <div>data:{data}</div>
              <div>error:{error}</div>
              <div>isValidating:{isValidating.toString()}</div>
            </div>
          ))}
        </div>
      )
    }

    renderWithConfig(<Page />)
    expect(screen.getAllByText('data:')).toHaveLength(2)

    await screen.findByText(`data:${key1}`)
    await screen.findByText(`data:${key2}`)
    expect(await screen.findAllByText(`error:`)).toHaveLength(2)
    expect(await screen.findAllByText(`isValidating:false`)).toHaveLength(2)
  })
})
