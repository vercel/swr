// `undefined` can possibly be replaced by something else.
export const UNDEFINED: undefined = ({} as any)[0]
export const isUndefined = (v: any) => v === UNDEFINED
export const isThenable = (v: any): v is Promise<any> =>
  v && typeof v.then === 'function'
export const noop = () => {}
