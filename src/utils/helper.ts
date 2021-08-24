// `undefined` can possibly be replaced by something else.
export const UNDEFINED: undefined = ({} as any)[0]
export const isUndefined = (v: any): v is undefined => v === UNDEFINED
export const isFunction = (v: any): v is Function => typeof v === 'function'
export const noop = () => {}
export const mergeObjects = (a: any, b: any) => Object.assign({}, a, b)
