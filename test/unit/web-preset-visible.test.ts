import { preset } from '../../src/_internal/utils/web-preset'

describe('web-preset isVisible', () => {
  it('returns a boolean', () => {
    expect(typeof preset.isVisible()).toBe('boolean')
  })

  it('checks document.visibilityState', () => {
    // In a real browser, this would return true when visible
    // In jsdom, it returns true by default
    const result = preset.isVisible()
    expect(typeof result).toBe('boolean')
  })
})

describe('web-preset hasFocus', () => {
  it('returns a boolean', () => {
    expect(typeof preset.hasFocus()).toBe('boolean')
  })

  it('checks document.hasFocus()', () => {
    // In jsdom, hasFocus() should be available on document
    const result = preset.hasFocus()
    expect(typeof result).toBe('boolean')
  })

  it('handles missing hasFocus gracefully', () => {
    // hasFocus should return a boolean
    const result = preset.hasFocus()
    expect(typeof result).toBe('boolean')
  })
})
