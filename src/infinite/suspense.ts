'use client'

import useSWR from '../index'
import { withMiddleware } from '../_internal'
import { suspense } from '../suspense/middleware'
import { infinite } from './index'
import type { SWRInfiniteHook } from './types'

const useSWRInfiniteSuspense = withMiddleware(
  withMiddleware(useSWR, suspense),
  infinite
) as unknown as SWRInfiniteHook<{ suspense: true }>

export default useSWRInfiniteSuspense
