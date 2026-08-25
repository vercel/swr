import { act, fireEvent, render, screen } from '@testing-library/react'
import React, { useEffect, useState } from 'react'
import useSWRInfinite from '../src/infinite'
import { sleep } from './utils'

describe('useSWRInfinite mutation bug', () => {
  it('should not change data reference if structurally identical', async () => {
    let isUpdated = false
    const fetcher = async () => {
      await sleep(10)
      return isUpdated ? [{ id: 1, updated: true }] : [{ id: 1 }]
    }
    const initialData = [[{ id: 1 }]]

    function Page() {
      const { data, mutate } = useSWRInfinite(
        index => `key-${index}`,
        fetcher,
        { fallbackData: initialData }
      )
      const [dataChanges, setDataChanges] = useState(0)

      const prevData = React.useRef(data)
      if (prevData.current !== data) {
        prevData.current = data
      }
      
      useEffect(() => {
        setDataChanges(c => c + 1)
      }, [data])

      return (
        <div>
          <div data-testid="changes">{dataChanges}</div>
          <button
            onClick={async () => {
              isUpdated = true
              await mutate(
                async () => {
                  await sleep(10)
                  return [[{ id: 1, updated: true }]]
                },
                {
                  optimisticData: [[{ id: 1, updated: true }]],
                  revalidate: true
                }
              )
            }}
          >
            Mutate
          </button>
        </div>
      )
    }

    render(<Page />)
    await screen.findByText('1') // initial data

    fireEvent.click(screen.getByText('Mutate'))

    await sleep(200)

    expect(screen.getByTestId('changes').textContent).toBe('2')
  })
})
