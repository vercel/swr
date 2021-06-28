// `undefined` can possibly be replaced by something else.
export const UNDEFINED: undefined = ({} as any)[0]
export const isUndefined = (v: any) => v === UNDEFINED
