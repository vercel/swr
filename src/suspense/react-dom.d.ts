import 'react-dom'

declare module 'react-dom' {
  export function browser(reason?: string | (() => unknown)): unknown
}
