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
    description: 'React Hooks pour la récupération de données.'
  },
  ja: {
    title: 'SWR',
    description: 'データフェッチングのための React Hooks。'
  },
  ko: {
    title: 'SWR',
    description: '데이터 페칭을 위한 React Hooks.'
  },
  pt: {
    title: 'SWR',
    description: 'React Hooks para busca de dados.'
  },
  ru: {
    title: 'SWR',
    description: 'React Hooks для получения данных.'
  },
  cn: {
    title: 'SWR',
    description: '用于数据请求的 React Hooks。'
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
    title: 'Récupération de données moderne, conçue pour React',
    description:
      'SWR est une API minimale avec mise en cache intégrée, revalidation et déduplication des requêtes. Il garde votre interface rapide, cohérente et toujours à jour — avec un seul hook React.'
  },
  ja: {
    title: 'モダンなデータフェッチング、React 向けに構築',
    description:
      'SWR は、組み込みキャッシュ、再検証、リクエストの重複排除を備えた最小限の API です。単一の React フックで、UI を高速で一貫性があり、常に最新の状態に保ちます。'
  },
  ko: {
    title: 'React를 위해 구축된 현대적인 데이터 페칭',
    description:
      'SWR은 내장 캐싱, 재검증 및 요청 중복 제거를 갖춘 최소한의 API입니다. 단일 React 훅으로 UI를 빠르고 일관되며 항상 최신 상태로 유지합니다.'
  },
  pt: {
    title: 'Busca de dados moderna, construída para React',
    description:
      'SWR é uma API mínima com cache integrado, revalidação e deduplicação de requisições. Mantém sua UI rápida, consistente e sempre atualizada — com um único hook React.'
  },
  ru: {
    title: 'Современная загрузка данных, созданная для React',
    description:
      'SWR — это минималистичный API со встроенным кэшированием, ревалидацией и дедупликацией запросов. Он поддерживает ваш UI быстрым, согласованным и всегда актуальным — с помощью одного React хука.'
  },
  cn: {
    title: '现代化的数据请求，专为 React 打造',
    description:
      'SWR 是一个极简的 API，内置缓存、重新验证和请求去重功能。只需一个 React Hook，即可让您的 UI 保持快速、一致且始终最新。'
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
    getStarted: 'Commencer'
  },
  ja: {
    getStarted: '始める'
  },
  ko: {
    getStarted: '시작하기'
  },
  pt: {
    getStarted: 'Começar'
  },
  ru: {
    getStarted: 'Начать'
  },
  cn: {
    getStarted: '开始使用'
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
    title: 'Récupérer des données avec un seul hook',
    description:
      'Passez une clé et un fetcher à useSWR. Le hook gère la requête, met en cache la réponse et garde les données à jour. Vous obtenez data, error et isLoading pour piloter votre interface.'
  },
  ja: {
    title: '1つのフックでデータを取得',
    description:
      'キーとフェッチャーを useSWR に渡します。フックはリクエストを管理し、レスポンスをキャッシュし、データを最新の状態に保ちます。UI を駆動するために data、error、isLoading を取得できます。'
  },
  ko: {
    title: '하나의 훅으로 데이터 가져오기',
    description:
      '키와 fetcher를 useSWR에 전달하세요. 훅은 요청을 관리하고, 응답을 캐시하며, 데이터를 최신 상태로 유지합니다. UI를 구동하기 위해 data, error, isLoading을 얻을 수 있습니다.'
  },
  pt: {
    title: 'Buscar dados com um hook',
    description:
      'Passe uma chave e um fetcher para useSWR. O hook gerencia a requisição, armazena a resposta em cache e mantém os dados atualizados. Você obtém data, error e isLoading para controlar sua UI.'
  },
  ru: {
    title: 'Загрузка данных одним хуком',
    description:
      'Передайте ключ и fetcher в useSWR. Хук управляет запросом, кэширует ответ и поддерживает данные актуальными. Вы получаете data, error и isLoading для управления вашим UI.'
  },
  cn: {
    title: '用一个 Hook 获取数据',
    description:
      '向 useSWR 传递一个 key 和 fetcher。该 Hook 会管理请求、缓存响应并保持数据新鲜。您会获得 data、error 和 isLoading 来驱动您的 UI。'
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
    title: 'Récupérer, demander et revalider',
    description:
      'SWR vous couvre dans tous les aspects de la vitesse, de la justesse et de la stabilité pour vous aider à créer de meilleures expériences.'
  },
  ja: {
    title: '取得、リクエスト、そして再検証',
    description:
      'SWR はスピード、正確性、安定性のあらゆる側面であなたをサポートし、より良い体験作りを助けます。'
  },
  ko: {
    title: '가져오기, 요청 및 재검증',
    description:
      'SWR은 속도, 정확성 및 안정성의 모든 측면을 다루어 더 나은 경험을 구축하는 데 도움이 됩니다.'
  },
  pt: {
    title: 'Buscar, solicitar e revalidar',
    description:
      'SWR cobre todos os aspectos de velocidade, correção e estabilidade para ajudá-lo a criar melhores experiências.'
  },
  ru: {
    title: 'Загрузка, запрос и ревалидация',
    description:
      'SWR покрывает все аспекты скорости, корректности и стабильности, чтобы помочь вам создавать лучший опыт.'
  },
  cn: {
    title: '获取、请求和重新验证',
    description:
      'SWR 在速度、正确性和稳定性等各个方面为您提供支持，帮助您构建更好的体验。'
  }
}

export const features: Record<Locale, string[]> = {
  en: [
    'Fast page navigation',
    'Polling on interval',
    'Data dependency',
    'Revalidation on focus',
    'Revalidation on network recovery',
    'Local mutation (Optimistic UI)',
    'Smart error retry',
    'Pagination and scroll position recovery',
    'React Suspense'
  ],
  fr: [
    'Navigation rapide entre les pages',
    'Interrogation à intervalles',
    'Dépendance des données',
    'Revalidation au focus',
    'Revalidation à la récupération du réseau',
    'Mutation locale (UI optimiste)',
    "Nouvelle tentative d'erreur intelligente",
    'Pagination et récupération de la position de défilement',
    'React Suspense'
  ],
  ja: [
    '高速なページナビゲーション',
    '間隔でのポーリング',
    'データ依存性',
    'フォーカス時の再検証',
    'ネットワーク回復時の再検証',
    'ローカルミューテーション（楽観的UI）',
    'スマートエラーリトライ',
    'ページネーションとスクロール位置の回復',
    'React Suspense'
  ],
  ko: [
    '빠른 페이지 탐색',
    '간격별 폴링',
    '데이터 종속성',
    '포커스 시 재검증',
    '네트워크 복구 시 재검증',
    '로컬 뮤테이션(낙관적 UI)',
    '스마트 오류 재시도',
    '페이지네이션 및 스크롤 위치 복구',
    'React Suspense'
  ],
  pt: [
    'Navegação rápida entre páginas',
    'Polling em intervalos',
    'Dependência de dados',
    'Revalidação ao focar',
    'Revalidação na recuperação da rede',
    'Mutação local (UI otimista)',
    'Nova tentativa de erro inteligente',
    'Paginação e recuperação de posição de rolagem',
    'React Suspense'
  ],
  ru: [
    'Быстрая навигация по страницам',
    'Опрос с интервалами',
    'Зависимость данных',
    'Ревалидация при фокусе',
    'Ревалидация при восстановлении сети',
    'Локальная мутация (Оптимистичный UI)',
    'Умная повторная попытка при ошибке',
    'Пагинация и восстановление позиции прокрутки',
    'React Suspense'
  ],
  cn: [
    '快速页面导航',
    '定时轮询',
    '数据依赖',
    '聚焦时重新验证',
    '网络恢复时重新验证',
    '本地变更（乐观 UI）',
    '智能错误重试',
    '分页和滚动位置恢复',
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
      title: 'Léger et agnostique',
      description:
        "Une petite surface d'API avec support pour n'importe quelle source de données — REST, GraphQL ou fetchers personnalisés."
    },
    {
      id: '2',
      title: 'Temps réel et résilient',
      description:
        'Revalidation automatique en arrière-plan, mises à jour focus/reconnexion et utilitaires pour la pagination et le streaming.'
    },
    {
      id: '3',
      title: 'Ergonomie React native',
      description:
        'Conçu pour Suspense, compatible avec SSR et SSG, et entièrement typé dès le départ.'
    }
  ],
  ja: [
    {
      id: '1',
      title: '軽量でアグノスティック',
      description:
        '任意のデータソース（REST、GraphQL、またはカスタムフェッチャー）をサポートする小さな API サーフェス。'
    },
    {
      id: '2',
      title: 'リアルタイムで回復力がある',
      description:
        '自動バックグラウンド再検証、フォーカス/再接続更新、ページネーションとストリーミングのユーティリティ。'
    },
    {
      id: '3',
      title: 'ネイティブ React エルゴノミクス',
      description:
        'Suspense 向けに構築され、SSR と SSG と互換性があり、最初から完全に型付けされています。'
    }
  ],
  ko: [
    {
      id: '1',
      title: '가볍고 독립적',
      description:
        '모든 데이터 소스(REST, GraphQL 또는 사용자 정의 fetcher)를 지원하는 작은 API 표면.'
    },
    {
      id: '2',
      title: '실시간 및 복원력',
      description:
        '자동 백그라운드 재검증, 포커스/재연결 업데이트, 페이지네이션 및 스트리밍 유틸리티.'
    },
    {
      id: '3',
      title: '네이티브 React 인체공학',
      description:
        'Suspense를 위해 구축되었으며, SSR 및 SSG와 호환되며 처음부터 완전히 타입이 지정되어 있습니다.'
    }
  ],
  pt: [
    {
      id: '1',
      title: 'Leve e agnóstico',
      description:
        'Uma superfície de API pequena com suporte para qualquer fonte de dados — REST, GraphQL ou fetchers personalizados.'
    },
    {
      id: '2',
      title: 'Tempo real e resiliente',
      description:
        'Revalidação automática em segundo plano, atualizações de foco/reconexão e utilitários para paginação e streaming.'
    },
    {
      id: '3',
      title: 'Ergonomia React nativa',
      description:
        'Construído para Suspense, compatível com SSR e SSG, e totalmente tipado desde o início.'
    }
  ],
  ru: [
    {
      id: '1',
      title: 'Легковесный и агностичный',
      description:
        'Небольшая поверхность API с поддержкой любого источника данных — REST, GraphQL или пользовательских fetchers.'
    },
    {
      id: '2',
      title: 'В реальном времени и отказоустойчивый',
      description:
        'Автоматическая фоновая ревалидация, обновления при фокусе/переподключении и утилиты для пагинации и потоковой передачи.'
    },
    {
      id: '3',
      title: 'Нативная эргономика React',
      description:
        'Построен для Suspense, совместим с SSR и SSG, полностью типизирован с самого начала.'
    }
  ],
  cn: [
    {
      id: '1',
      title: '轻量且框架无关',
      description:
        '小巧的 API 表面，支持任何数据源 — REST、GraphQL 或自定义 fetcher。'
    },
    {
      id: '2',
      title: '实时且具有弹性',
      description:
        '自动后台重新验证、聚焦/重连更新，以及用于分页和流式传输的工具。'
    },
    {
      id: '3',
      title: '原生 React 人体工程学',
      description:
        '为 Suspense 构建，与 SSR 和 SSG 兼容，从一开始就完全类型化。'
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
    title: 'Commencez à construire avec SWR',
    cta: 'Commencer'
  },
  ja: {
    title: 'SWR で構築を始める',
    cta: '始める'
  },
  ko: {
    title: 'SWR로 구축 시작하기',
    cta: '시작하기'
  },
  pt: {
    title: 'Comece a construir com SWR',
    cta: 'Começar'
  },
  ru: {
    title: 'Начните создавать с SWR',
    cta: 'Начать'
  },
  cn: {
    title: '开始使用 SWR 构建',
    cta: '开始使用'
  }
}
