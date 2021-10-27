/**
 * @jest-environment node
 *
 * Simulate web preset in node env
 */

import { EventEmitter } from 'events'

type WindowType = Window & typeof globalThis

const FOCUS_EVENT = 'focus'

const createEvent = type => ({ type } as Event)

function mockBrowserWindow() {
  const events = new EventEmitter()
  const win = {
    addEventListener(name, fn) {
      events.on(name, fn)
    },
    removeEventListener(name, fn) {
      events.off(name, fn)
    },
    dispatchEvent(event) {
      events.emit(event.type)
    }
  }
  return win as WindowType
}

describe('Web Preset', () => {
  let win
  let webPreset
  let initFocus

  it('should trigger listener when window has browser APIs', async () => {
    // Use require to avoid pre-eval for global values like `helper.hasWindow`
    win = globalThis.window = mockBrowserWindow()
    webPreset = require('../../src/utils/web-preset')
    initFocus = webPreset.defaultConfigOptions.initFocus

    const fn = jest.fn()
    const release = initFocus(fn) as () => void

    win.dispatchEvent(createEvent(FOCUS_EVENT))
    expect(fn).toBeCalledTimes(1)

    release()
    win.dispatchEvent(createEvent(FOCUS_EVENT))
    expect(fn).toBeCalledTimes(1)

    delete global.window
  })

  it('should not trigger listener when window is falsy', async () => {
    // @ts-ignore
    win = globalThis['window'] = {
      dispatchEvent: mockBrowserWindow().dispatchEvent
    }
    webPreset = require('../../src/utils/web-preset')
    initFocus = webPreset.defaultConfigOptions.initFocus
    global.window = win

    const fn = jest.fn()
    const release = initFocus(fn) as () => void

    win.dispatchEvent(createEvent(FOCUS_EVENT))
    expect(fn).toBeCalledTimes(0)

    release()
    win.dispatchEvent(createEvent(FOCUS_EVENT))
    expect(fn).toBeCalledTimes(0)

    delete global.window
  })
})
