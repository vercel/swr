// Shared state between server components and client components

export const noop = () => {}

// Using noop() as the undefined value as undefined can be replaced
// by something else. Prettier ignore and extra parentheses are necessary here
// to ensure that tsc doesn't remove the __NOINLINE__ comment.
// prettier-ignore
export const UNDEFINED = (/*#__NOINLINE__*/ noop()) as undefined

export const OBJECT = Object

export const isUndefined = (v: any): v is undefined => v === UNDEFINED
export const isFunction = <
  T extends (...args: any[]) => any = (...args: any[]) => any
>(
  v: unknown
): v is T => typeof v == 'function'
export const mergeObjects = (a: any, b?: any) => ({ ...a, ...b })
export const isPromiseLike = (x: unknown): x is PromiseLike<unknown> =>
  isFunction((x as any).then)
