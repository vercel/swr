'use client'

import useSWR, { useSWRConfig } from 'swr'

const projectsTag = '/team/projects'
let version = 0

const fetcher = (key: string) => `${key}:${version}`

export default function CacheTagsPage() {
  const { invalidateTag } = useSWRConfig()
  const { data: projects } = useSWR('/api/projects', fetcher, {
    tags: [projectsTag],
    dedupingInterval: 0,
    revalidateOnFocus: false
  })
  const { data: favorites } = useSWR('/api/projects?favorites=1', fetcher, {
    tags: () => [projectsTag],
    dedupingInterval: 0,
    revalidateOnFocus: false
  })
  const { data: unrelated } = useSWR('/api/profile', fetcher, {
    tags: ['/profile'],
    dedupingInterval: 0,
    revalidateOnFocus: false
  })

  return (
    <main>
      <div data-testid="projects">{projects}</div>
      <div data-testid="favorites">{favorites}</div>
      <div data-testid="unrelated">{unrelated}</div>
      <button
        onClick={() => {
          version++
          void invalidateTag(projectsTag)
        }}
      >
        Invalidate projects
      </button>
    </main>
  )
}
