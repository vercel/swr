'use client'

// Instead of `export { SWRConfig } from '../_internal'`, here we use
// `export const` to workaround a problem in Bunchee's Client Boundary handling.
import { SWRConfig as S } from '../_internal'
export const SWRConfig = S
