'use client'

import { Suspense, useLayoutEffect, useState } from 'react'
import useSWR, { preload } from 'swr'
import { OnlyRenderInClient } from '~/component/only-render-in-client'
import { sleep } from '~/lib/sleep'

async function fetchFreshValue() {
  await sleep(120)
  return 'fresh'
}

function Preload({ children }: { children?: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)
  useLayoutEffect(() => {
    preload('render-suspense-no-revalidate', () => 'cached')
    setIsMounted(true)
  }, [])
  return isMounted ? <>{children}</> : null
}

function Section() {
  const { data } = useSWR('render-suspense-no-revalidate', fetchFreshValue, {
    suspense: true,
    revalidateIfStale: false
  })

  return <div data-testid="data">data: {data}</div>
}

export default function Page() {
  return (
    <OnlyRenderInClient>
      <Preload>
        <Suspense fallback={<div data-testid="fallback">fallback</div>}>
          <Section />
        </Suspense>
      </Preload>
    </OnlyRenderInClient>
  )
}
