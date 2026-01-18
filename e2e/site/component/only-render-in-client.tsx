'use client'
import React from 'react'

// This component ensures its children are only rendered on the client side.
export function OnlyRenderInClient({
  children
}: {
  children?: React.ReactNode
}) {
  const [isClient, setIsClient] = React.useState(false)
  React.useEffect(() => {
    setIsClient(true)
  }, [])
  if (!isClient) {
    return null
  }
  return <>{children}</>
}
