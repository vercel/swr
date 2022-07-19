import { rAF } from 'swr/_internal'
import { expectType } from './utils'

export function rAFTyping() {
  expectType<
    (f: (...args: any[]) => void) => ReturnType<typeof setTimeout> | number
  >(rAF)
}
