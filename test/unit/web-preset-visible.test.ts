import { preset } from '../../src/_internal/utils/web-preset'

describe('web-preset isVisible', () => {
  it('returns true when visibilityState is visible', () => {
    expect(preset.isVisible()).toBe(true)
  })

  it('returns false when visibilityState is hidden', () => {
    const spy = jest.spyOn(document, 'visibilityState', 'get')
    spy.mockReturnValue('hidden')
    expect(preset.isVisible()).toBe(false)
    spy.mockRestore()
  })
})

describe('web-preset hasFocus', () => {
  it('returns true when document.hasFocus() is true', () => {
    const spy = jest.spyOn(document, 'hasFocus')
    spy.mockReturnValue(true)
    expect(preset.hasFocus()).toBe(true)
    spy.mockRestore()
  })

  it('returns false when document.hasFocus() is false', () => {
    const spy = jest.spyOn(document, 'hasFocus')
    spy.mockReturnValue(false)
    expect(preset.hasFocus()).toBe(false)
    spy.mockRestore()
  })
})
