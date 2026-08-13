import { EventEmitter } from 'events'

const FOCUS_EVENT = 'focus'
const VISIBILITYCHANGE_EVENT = 'visibilitychange'

function createEventTarget() {
  EventEmitter.prototype['addEventListener'] = EventEmitter.prototype.on
  EventEmitter.prototype['removeEventListener'] = EventEmitter.prototype.off
  const target = new EventEmitter()

  return target
}

function runTests(propertyName) {
  let initFocus
  const eventName =
    propertyName === 'window' ? FOCUS_EVENT : VISIBILITYCHANGE_EVENT

  describe(`Web Preset ${propertyName}`, () => {
    const globalSpy = {
      window: undefined,
      document: undefined
    }

    beforeEach(() => {
      globalSpy.window = jest.spyOn(global, 'window', 'get')
      globalSpy.document = jest.spyOn(global, 'document', 'get')

      jest.resetModules()
    })

    afterEach(() => {
      globalSpy.window.mockClear()
      globalSpy.document.mockClear()
    })

    it(`should trigger listener when ${propertyName} has browser APIs`, async () => {
      const target = createEventTarget()
      if (propertyName === 'window') {
        globalSpy.window.mockImplementation(() => target)
        globalSpy.document.mockImplementation(() => undefined)
      } else if (propertyName === 'document') {
        globalSpy.window.mockImplementation(() => undefined)
        globalSpy.document.mockImplementation(() => target)
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      initFocus = require('swr/_internal').defaultConfigOptions.initFocus

      const fn = jest.fn()
      const release = initFocus(fn) as () => void

      target.emit(eventName)
      expect(fn).toHaveBeenCalledTimes(1)

      release()
      target.emit(eventName)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it(`should not trigger listener when ${propertyName} is falsy`, async () => {
      if (propertyName === 'window') {
        // window exists but without event APIs
        globalSpy.window.mockImplementation(() => ({
          emit: createEventTarget().emit
        }))
        globalSpy.document.mockImplementation(() => undefined)
      } else if (propertyName === 'document') {
        globalSpy.window.mockImplementation(() => undefined)
        globalSpy.document.mockImplementation(() => undefined)
      }

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      initFocus = require('swr/_internal').defaultConfigOptions.initFocus

      const fn = jest.fn()
      const release = initFocus(fn) as () => void
      const target = global[propertyName]

      target?.emit?.(eventName)

      expect(fn).toHaveBeenCalledTimes(0)

      release()
      if (target && target.emit) {
        target.emit(eventName)
      }
      expect(fn).toHaveBeenCalledTimes(0)
    })
  })
}

runTests('window')
runTests('document')

describe('Web Preset isVisible', () => {
  const globalSpy = {
    window: undefined as any,
    document: undefined as any
  }

  beforeEach(() => {
    globalSpy.window = jest.spyOn(global, 'window', 'get')
    globalSpy.document = jest.spyOn(global, 'document', 'get')
    jest.resetModules()
  })

  afterEach(() => {
    globalSpy.window.mockClear()
    globalSpy.document.mockClear()
  })

  it('should return true when visibilityState is visible and window is focused', () => {
    const target = createEventTarget()
    ;(target as any).visibilityState = 'visible'
    globalSpy.window.mockImplementation(() => target)
    globalSpy.document.mockImplementation(() => target)

    const { preset: p } = require('swr/_internal')
    expect(p.isVisible()).toBe(true)
  })

  it('should return false when visibilityState is hidden', () => {
    const target = createEventTarget()
    ;(target as any).visibilityState = 'hidden'
    globalSpy.window.mockImplementation(() => undefined)
    globalSpy.document.mockImplementation(() => target)

    const { preset: p } = require('swr/_internal')
    expect(p.isVisible()).toBe(false)
  })

  it('should return false when window loses focus (Alt-Tab / OS-level window switch)', () => {
    const target = createEventTarget()
    ;(target as any).visibilityState = 'visible'
    globalSpy.window.mockImplementation(() => target)
    globalSpy.document.mockImplementation(() => target)

    const { preset: p } = require('swr/_internal')
    expect(p.isVisible()).toBe(true)

    // Simulate Alt-Tab by emitting blur event on window
    target.emit('blur')
    expect(p.isVisible()).toBe(false)

    // Simulate returning to the window
    target.emit('focus')
    expect(p.isVisible()).toBe(true)
  })

  it('should return true when document is not defined (server / React Native)', () => {
    globalSpy.window.mockImplementation(() => undefined)
    globalSpy.document.mockImplementation(() => undefined)

    const { preset: p } = require('swr/_internal')
    expect(p.isVisible()).toBe(true)
  })
})
