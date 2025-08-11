import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { preset } from '../../src/_internal/utils/web-preset'

describe('web-preset isVisible', () => {
  let originalDocument: any

  beforeEach(() => {
    originalDocument = global.document
    global.document = {
      visibilityState: 'visible',
      hasFocus: () => true
    }
  })

  afterEach(() => {
    global.document = originalDocument
  })

  it('returns true when document is visible and focused', () => {
    global.document.visibilityState = 'visible'
    global.document.hasFocus = () => true
    expect(preset.isVisible()).toBe(true)
  })

  it('returns false when document is hidden and not focused', () => {
    global.document.visibilityState = 'hidden'
    global.document.hasFocus = () => false
    expect(preset.isVisible()).toBe(false)
  })

  it('returns false when document is hidden but focused', () => {
    global.document.visibilityState = 'hidden'
    global.document.hasFocus = () => true
    expect(preset.isVisible()).toBe(false)
  })

  it('returns false when document is visible but not focused', () => {
    global.document.visibilityState = 'visible'
    global.document.hasFocus = () => false
    expect(preset.isVisible()).toBe(false)
  })

  it('returns true if hasFocus is not a function', () => {
    global.document.visibilityState = 'visible'
    // @ts-expect-error
    global.document.hasFocus = undefined
    expect(preset.isVisible()).toBe(true)
  })

  it('returns true if there is an exception', () => {
    Object.defineProperty(global, 'document', {
      get() { throw new Error('Simulated error') }
    })
    expect(preset.isVisible()).toBe(true)
  })
})