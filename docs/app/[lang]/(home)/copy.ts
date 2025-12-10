import type { translations } from '@/geistdocs'

type Locale = keyof typeof translations

export const metadata: Record<
  Locale,
  {
    title: string
    description: string
  }
> = {
  en: {
    title: 'SWR',
    description: 'React Hooks for Data Fetching.'
  },
  fr: {
    title: 'SWR',
    description: 'React Hooks for Data Fetching.'
  },
  ja: {
    title: 'SWR',
    description: 'React Hooks for Data Fetching.'
  },
  ko: {
    title: 'SWR',
    description: 'React Hooks for Data Fetching.'
  },
  pt: {
    title: 'SWR',
    description: 'React Hooks for Data Fetching.'
  },
  ru: {
    title: 'SWR',
    description: 'React Hooks for Data Fetching.'
  },
  cn: {
    title: 'SWR',
    description: 'React Hooks for Data Fetching.'
  }
}

export const hero: Record<
  Locale,
  {
    title: string
    description: string
  }
> = {
  en: {
    title: 'Modern data fetching, built for React',
    description:
      'SWR is a minimal API with built-in caching, revalidation, and request deduplication. It keeps your UI fast, consistent, and always up to date — with a single React hook.'
  },
  fr: {
    title: 'Modern data fetching, built for React',
    description:
      'SWR is a minimal API with built-in caching, revalidation, and request deduplication. It keeps your UI fast, consistent, and always up to date — with a single React hook.'
  },
  ja: {
    title: 'Modern data fetching, built for React',
    description:
      'SWR is a minimal API with built-in caching, revalidation, and request deduplication. It keeps your UI fast, consistent, and always up to date — with a single React hook.'
  },
  ko: {
    title: 'Modern data fetching, built for React',
    description:
      'SWR is a minimal API with built-in caching, revalidation, and request deduplication. It keeps your UI fast, consistent, and always up to date — with a single React hook.'
  },
  pt: {
    title: 'Modern data fetching, built for React',
    description:
      'SWR is a minimal API with built-in caching, revalidation, and request deduplication. It keeps your UI fast, consistent, and always up to date — with a single React hook.'
  },
  ru: {
    title: 'Modern data fetching, built for React',
    description:
      'SWR is a minimal API with built-in caching, revalidation, and request deduplication. It keeps your UI fast, consistent, and always up to date — with a single React hook.'
  },
  cn: {
    title: 'Modern data fetching, built for React',
    description:
      'SWR is a minimal API with built-in caching, revalidation, and request deduplication. It keeps your UI fast, consistent, and always up to date — with a single React hook.'
  }
}

export const buttons: Record<
  Locale,
  {
    getStarted: string
  }
> = {
  en: {
    getStarted: 'Get Started'
  },
  fr: {
    getStarted: 'Get Started'
  },
  ja: {
    getStarted: 'Get Started'
  },
  ko: {
    getStarted: 'Get Started'
  },
  pt: {
    getStarted: 'Get Started'
  },
  ru: {
    getStarted: 'Get Started'
  },
  cn: {
    getStarted: 'Get Started'
  }
}

export const oneTwoSection: Record<
  Locale,
  {
    title: string
    description: string
  }
> = {
  en: {
    title: 'Fetch data with one hook',
    description:
      'Pass a key and a fetcher to useSWR. The hook manages the request, caches the response, and keeps data fresh. You get data, error, and isLoading to drive your UI.'
  },
  fr: {
    title: 'Fetch data with one hook',
    description:
      'Pass a key and a fetcher to useSWR. The hook manages the request, caches the response, and keeps data fresh. You get data, error, and isLoading to drive your UI.'
  },
  ja: {
    title: 'Fetch data with one hook',
    description:
      'Pass a key and a fetcher to useSWR. The hook manages the request, caches the response, and keeps data fresh. You get data, error, and isLoading to drive your UI.'
  },
  ko: {
    title: 'Fetch data with one hook',
    description:
      'Pass a key and a fetcher to useSWR. The hook manages the request, caches the response, and keeps data fresh. You get data, error, and isLoading to drive your UI.'
  },
  pt: {
    title: 'Fetch data with one hook',
    description:
      'Pass a key and a fetcher to useSWR. The hook manages the request, caches the response, and keeps data fresh. You get data, error, and isLoading to drive your UI.'
  },
  ru: {
    title: 'Fetch data with one hook',
    description:
      'Pass a key and a fetcher to useSWR. The hook manages the request, caches the response, and keeps data fresh. You get data, error, and isLoading to drive your UI.'
  },
  cn: {
    title: 'Fetch data with one hook',
    description:
      'Pass a key and a fetcher to useSWR. The hook manages the request, caches the response, and keeps data fresh. You get data, error, and isLoading to drive your UI.'
  }
}

export const centeredSection: Record<
  Locale,
  {
    title: string
    description: string
  }
> = {
  en: {
    title: 'Fetch, request and revalidate',
    description:
      'SWR has you covered in all aspects of speed, correctness, and stability to help you build better experiences.'
  },
  fr: {
    title: 'Fetch, request and revalidate',
    description:
      'SWR has you covered in all aspects of speed, correctness, and stability to help you build better experiences.'
  },
  ja: {
    title: 'Fetch, request and revalidate',
    description:
      'SWR has you covered in all aspects of speed, correctness, and stability to help you build better experiences.'
  },
  ko: {
    title: 'Fetch, request and revalidate',
    description:
      'SWR has you covered in all aspects of speed, correctness, and stability to help you build better experiences.'
  },
  pt: {
    title: 'Fetch, request and revalidate',
    description:
      'SWR has you covered in all aspects of speed, correctness, and stability to help you build better experiences.'
  },
  ru: {
    title: 'Fetch, request and revalidate',
    description:
      'SWR has you covered in all aspects of speed, correctness, and stability to help you build better experiences.'
  },
  cn: {
    title: 'Fetch, request and revalidate',
    description:
      'SWR has you covered in all aspects of speed, correctness, and stability to help you build better experiences.'
  }
}

export const features: Record<Locale, string[]> = {
  en: [
    'Fast page navigation',
    'Polling on interval',
    'Data dependency',
    'Revalidation on focus',
    'Revalidation on network recovery',
    'Local mutation(Optimistic UI)',
    'Smart error retry',
    'Pagination and scroll position recovery',
    'React Suspense'
  ],
  fr: [
    'Fast page navigation',
    'Polling on interval',
    'Data dependency',
    'Revalidation on focus',
    'Revalidation on network recovery',
    'Local mutation(Optimistic UI)',
    'Smart error retry',
    'Pagination and scroll position recovery',
    'React Suspense'
  ],
  ja: [
    'Fast page navigation',
    'Polling on interval',
    'Data dependency',
    'Revalidation on focus',
    'Revalidation on network recovery',
    'Local mutation(Optimistic UI)',
    'Smart error retry',
    'Pagination and scroll position recovery',
    'React Suspense'
  ],
  ko: [
    'Fast page navigation',
    'Polling on interval',
    'Data dependency',
    'Revalidation on focus',
    'Revalidation on network recovery',
    'Local mutation(Optimistic UI)',
    'Smart error retry',
    'Pagination and scroll position recovery',
    'React Suspense'
  ],
  pt: [
    'Fast page navigation',
    'Polling on interval',
    'Data dependency',
    'Revalidation on focus',
    'Revalidation on network recovery',
    'Local mutation(Optimistic UI)',
    'Smart error retry',
    'Pagination and scroll position recovery',
    'React Suspense'
  ],
  ru: [
    'Fast page navigation',
    'Polling on interval',
    'Data dependency',
    'Revalidation on focus',
    'Revalidation on network recovery',
    'Local mutation(Optimistic UI)',
    'Smart error retry',
    'Pagination and scroll position recovery',
    'React Suspense'
  ],
  cn: [
    'Fast page navigation',
    'Polling on interval',
    'Data dependency',
    'Revalidation on focus',
    'Revalidation on network recovery',
    'Local mutation(Optimistic UI)',
    'Smart error retry',
    'Pagination and scroll position recovery',
    'React Suspense'
  ]
}

export const textGridSection: Record<
  Locale,
  Array<{
    id: string
    title: string
    description: string
  }>
> = {
  en: [
    {
      id: '1',
      title: 'Lightweight and agnostic',
      description:
        'A small API surface with support for any data source — REST, GraphQL, or custom fetchers.'
    },
    {
      id: '2',
      title: 'Realtime and resilient',
      description:
        'Automatic background revalidation, focus/reconnect updates, and utilities for pagination and streaming.'
    },
    {
      id: '3',
      title: 'Native React ergonomics',
      description:
        'Built for Suspense, compatible with SSR and SSG, and fully typed from the ground up.'
    }
  ],
  fr: [
    {
      id: '1',
      title: 'Lightweight and agnostic',
      description:
        'A small API surface with support for any data source — REST, GraphQL, or custom fetchers.'
    },
    {
      id: '2',
      title: 'Realtime and resilient',
      description:
        'Automatic background revalidation, focus/reconnect updates, and utilities for pagination and streaming.'
    },
    {
      id: '3',
      title: 'Native React ergonomics',
      description:
        'Built for Suspense, compatible with SSR and SSG, and fully typed from the ground up.'
    }
  ],
  ja: [
    {
      id: '1',
      title: 'Lightweight and agnostic',
      description:
        'A small API surface with support for any data source — REST, GraphQL, or custom fetchers.'
    },
    {
      id: '2',
      title: 'Realtime and resilient',
      description:
        'Automatic background revalidation, focus/reconnect updates, and utilities for pagination and streaming.'
    },
    {
      id: '3',
      title: 'Native React ergonomics',
      description:
        'Built for Suspense, compatible with SSR and SSG, and fully typed from the ground up.'
    }
  ],
  ko: [
    {
      id: '1',
      title: 'Lightweight and agnostic',
      description:
        'A small API surface with support for any data source — REST, GraphQL, or custom fetchers.'
    },
    {
      id: '2',
      title: 'Realtime and resilient',
      description:
        'Automatic background revalidation, focus/reconnect updates, and utilities for pagination and streaming.'
    },
    {
      id: '3',
      title: 'Native React ergonomics',
      description:
        'Built for Suspense, compatible with SSR and SSG, and fully typed from the ground up.'
    }
  ],
  pt: [
    {
      id: '1',
      title: 'Lightweight and agnostic',
      description:
        'A small API surface with support for any data source — REST, GraphQL, or custom fetchers.'
    },
    {
      id: '2',
      title: 'Realtime and resilient',
      description:
        'Automatic background revalidation, focus/reconnect updates, and utilities for pagination and streaming.'
    },
    {
      id: '3',
      title: 'Native React ergonomics',
      description:
        'Built for Suspense, compatible with SSR and SSG, and fully typed from the ground up.'
    }
  ],
  ru: [
    {
      id: '1',
      title: 'Lightweight and agnostic',
      description:
        'A small API surface with support for any data source — REST, GraphQL, or custom fetchers.'
    },
    {
      id: '2',
      title: 'Realtime and resilient',
      description:
        'Automatic background revalidation, focus/reconnect updates, and utilities for pagination and streaming.'
    },
    {
      id: '3',
      title: 'Native React ergonomics',
      description:
        'Built for Suspense, compatible with SSR and SSG, and fully typed from the ground up.'
    }
  ],
  cn: [
    {
      id: '1',
      title: 'Lightweight and agnostic',
      description:
        'A small API surface with support for any data source — REST, GraphQL, or custom fetchers.'
    },
    {
      id: '2',
      title: 'Realtime and resilient',
      description:
        'Automatic background revalidation, focus/reconnect updates, and utilities for pagination and streaming.'
    },
    {
      id: '3',
      title: 'Native React ergonomics',
      description:
        'Built for Suspense, compatible with SSR and SSG, and fully typed from the ground up.'
    }
  ]
}

export const cta: Record<
  Locale,
  {
    title: string
    cta: string
  }
> = {
  en: {
    title: 'Start building with SWR',
    cta: 'Get started'
  },
  fr: {
    title: 'Start building with SWR',
    cta: 'Get started'
  },
  ja: {
    title: 'Start building with SWR',
    cta: 'Get started'
  },
  ko: {
    title: 'Start building with SWR',
    cta: 'Get started'
  },
  pt: {
    title: 'Start building with SWR',
    cta: 'Get started'
  },
  ru: {
    title: 'Start building with SWR',
    cta: 'Get started'
  },
  cn: {
    title: 'Start building with SWR',
    cta: 'Get started'
  }
}
