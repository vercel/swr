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

      initFocus = require('swr/_internal').defaultConfigOptions.initFocus

      const fn = jest.fn()
      const release = initFocus(fn) as () => void

      target.emit(eventName)
      expect(fn).toBeCalledTimes(1)

      release()
      target.emit(eventName)
      expect(fn).toBeCalledTimes(1)
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

      initFocus = require('swr/_internal').defaultConfigOptions.initFocus

      const fn = jest.fn()
      const release = initFocus(fn) as () => void
      const target = global[propertyName]

      target?.emit?.(eventName)

      expect(fn).toBeCalledTimes(0)

      release()
      if (target && target.emit) {
        target.emit(eventName)
      }
      expect(fn).toBeCalledTimes(0)
    })
  })
}

runTests('window')
runTests('document')
