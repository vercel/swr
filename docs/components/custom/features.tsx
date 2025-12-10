'use client'

import { useId } from 'react'
import type { ReactNode } from 'react'
import { featuresMap, titleMap } from '../translations/text'
import { useParams } from 'next/navigation'

import {
  BackendAgnosticIcon,
  LightweightIcon,
  PaginationIcon,
  RealtimeIcon,
  RemoteLocalIcon,
  RenderingStrategiesIcon,
  SuspenseIcon,
  TypeScriptIcon
} from './icons'

export function Feature({ text, icon }: { text: string; icon: ReactNode }) {
  return (
    <div className="inline-flex items-center md:justify-start justify-center md:pl-0 [&_svg]:w-5 md:[&_svg]:w-6 max-[370px]:[&_svg]:w-4 max-[370px]:[&_svg]:stroke-[2.5px]">
      {icon}
      <h4 className="ml-2 m-0 font-bold text-lg whitespace-nowrap max-[370px]:text-sm md:text-lg max-[860px]:text-[0.9rem]">
        {text}
      </h4>
    </div>
  )
}

const FEATURES_LIST: { key: string; icon: ReactNode }[] = [
  { key: 'lightweight', icon: <LightweightIcon /> },
  { key: 'realtime', icon: <RealtimeIcon /> },
  { key: 'suspense', icon: <SuspenseIcon /> },
  { key: 'pagination', icon: <PaginationIcon /> },
  { key: 'backendAgnostic', icon: <BackendAgnosticIcon /> },
  { key: 'renderingStrategies', icon: <RenderingStrategiesIcon /> },
  { key: 'typescript', icon: <TypeScriptIcon /> },
  { key: 'remoteLocal', icon: <RemoteLocalIcon /> }
]

export default function Features() {
  const keyId = useId()
  const { lang } = useParams()
  const title = titleMap[lang as keyof typeof titleMap]
  const features = featuresMap[lang as keyof typeof featuresMap]

  return (
    <div className="mx-auto max-w-full w-[880px] text-center px-4 mb-10">
      <p className="text-lg mb-2 text-gray-600 md:text-2xl!">{title}</p>
      <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-10 mb-8 md:grid-cols-4 lg:gap-x-8 max-[860px]:gap-x-2">
        {FEATURES_LIST.map(({ key, icon }) => (
          <Feature
            text={features[key as keyof typeof features] as string}
            icon={icon}
            key={keyId + key}
          />
        ))}
      </div>
    </div>
  )
}
