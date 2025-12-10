'use client'

import { diagramCachePathsMap } from '../../translations/svgs'
import { useParams } from 'next/navigation'

export const Cache = () => {
  const { lang } = useParams()
  const paths =
    typeof lang === 'string' && lang in diagramCachePathsMap
      ? diagramCachePathsMap[lang as keyof typeof diagramCachePathsMap]
      : diagramCachePathsMap.en

  return (
    <svg viewBox="0 0 588 311" fill="none" className="invert-on-dark">
      <path stroke="#D2D2D2" d="M22.5 59.5h543v232h-543z" />
      <path fill="#fff" d={paths.boxFirstCacheProvider} />
      <path fill="#141414" d={paths.firstCacheProvider} />
      <path stroke="#D2D2D2" d="M54.5 91.5h256v168h-256z" />
      <circle cx={183} cy={174} r={44.5} fill="#EAEAEA" stroke="#D3D3D3" />
      <path fill="#000" d={paths.leftSWRHooks} />
      <circle cx={434} cy={174} r={44.5} fill="#EAEAEA" stroke="#D3D3D3" />
      <path fill="#000" d={paths.rightSWRHooks} />
      <path fill="#fff" d={paths.boxSecondCacheProvider} />
      <path fill="#141414" d={paths.secondCacheProvider} />
      <path fill="#9A9A9A" d={paths.defaultCacheProvider} />
    </svg>
  )
}
