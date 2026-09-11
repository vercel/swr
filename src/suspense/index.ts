'use client'

import useSWR from '../index'
import { withMiddleware } from '../_internal'
import type { SWRHook } from '../_internal'
import { suspense } from './middleware'

const useSWRSuspense = withMiddleware(useSWR, suspense) as unknown as SWRHook<{
  suspense: true
}>

export default useSWRSuspense
