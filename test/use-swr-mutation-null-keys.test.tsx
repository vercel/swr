import { renderHook } from '@testing-library/react'
import useSWRMutation from '../src/mutation/index'

describe('useSWRMutation - Null Key', () => {
  it('should not log an error when the key is null', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const fetcher = jest.fn()

    const { result } = renderHook(() => useSWRMutation(null, fetcher))

    await result.current.trigger()

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
