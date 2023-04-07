'use client'
import { useEffect, useRef } from 'react'

export const useDebugHistory = <T>(data: T, prefix = '') => {
  const dataRef = useRef<T[]>([])
  const debugRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    dataRef.current.push(data)
    if (debugRef.current) {
      debugRef.current.innerText = `${prefix}${JSON.stringify(dataRef.current)}`
    }
  }, [data, prefix])
  return debugRef
}
