import { screen, fireEvent } from '@testing-library/react'
import useSWR, { useSWRConfig, mutateTag as globalMutateTag } from 'swr'
import {
  createKey,
  createResponse,
  renderWithConfig,
  renderWithGlobalCache
} from './utils'
import useSWRInfinite from 'swr/infinite'

describe('mutateTag', () => {
  it('should return the global mutateTag by default', async () => {
    let localMutateTag
    function Page() {
      const { mutateTag } = useSWRConfig()
      localMutateTag = mutateTag
      return null
    }

    renderWithGlobalCache(<Page />)
    expect(localMutateTag).toBe(globalMutateTag)
  })

  it('should support mutate tag', async () => {
    const key1 = createKey()
    const key2 = createKey()
    const key3 = createKey()
    const key4 = createKey()

    let count1 = 0
    let count2 = 0
    let count3 = 0
    let count4 = 0

    function Page() {
      const { data: tag1Data } = useSWR(key1, () => ++count1, { tag: ['tag1'] })
      const { data: tag12Data } = useSWR(key2, () => ++count2, {
        tag: ['tag1', 'tag2']
      })
      const { data: tag2Data } = useSWR(key3, () => ++count3, { tag: ['tag2'] })
      const { data: nonTagData } = useSWR(key4, () => ++count4)
      const { mutateTag } = useSWRConfig()

      return (
        <div>
          <button
            onClick={() => {
              mutateTag('tag1')
            }}
          >
            click
          </button>
          <p>tag1Data:{tag1Data}</p>
          <p>tag12Data:{tag12Data}</p>
          <p>tag2Data:{tag2Data}</p>
          <p>nonTagData:{nonTagData}</p>
        </div>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('tag1Data:1')
    await screen.findByText('tag12Data:1')
    await screen.findByText('tag2Data:1')
    await screen.findByText('nonTagData:1')

    // mutate tag1
    fireEvent.click(screen.getByText('click'))
    await screen.findByText('tag1Data:2')
    await screen.findByText('tag12Data:2')
    await screen.findByText('tag2Data:1')
    await screen.findByText('nonTagData:1')
  })

  it("should support useSWRInfinite's mutate tag", async () => {
    const key1 = createKey()
    const key2 = createKey()
    let count1 = 0
    let count2 = 0

    const infiniteKey1 = 'infinite-' + createKey()
    const infiniteKey2 = 'infinite-' + createKey()
    let infiniteCount1 = 0
    let infiniteCount2 = 0

    function Page() {
      const { data: tag1Data } = useSWR(key1, () => createResponse(++count1), {
        tag: ['tag1']
      })
      const { data: tag2Data } = useSWR(key2, () => createResponse(++count2), {
        tag: ['tag2']
      })
      const { data: tag1InfiniteData } = useSWRInfinite(
        index => `page-${index}-${infiniteKey1}`,
        () => createResponse(++infiniteCount1),
        { tag: ['tag1'], revalidateFirstPage: false }
      )
      const { data: tag2InfiniteData } = useSWRInfinite(
        index => `page-${index}-${infiniteKey2}`,
        () => createResponse(++infiniteCount2),
        { tag: ['tag2'], revalidateFirstPage: false }
      )

      const { mutateTag } = useSWRConfig()

      return (
        <div>
          <button
            onClick={() => {
              mutateTag('tag1')
            }}
          >
            click
          </button>
          <p>tag1Data:{tag1Data}</p>
          <p>tag2Data:{tag2Data}</p>
          <p>tag1InfiniteData:{tag1InfiniteData}</p>
          <p>tag2InfiniteData:{tag2InfiniteData}</p>
        </div>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('tag1Data:1')
    await screen.findByText('tag2Data:1')
    await screen.findByText('tag1InfiniteData:1')
    await screen.findByText('tag2InfiniteData:1')

    // mutate tag1
    fireEvent.click(screen.getByText('click'))
    await screen.findByText('tag1Data:2')
    await screen.findByText('tag2Data:1')
    await screen.findByText('tag1InfiniteData:2')
    await screen.findByText('tag2InfiniteData:1')
  })
})
