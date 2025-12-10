import { createMDX } from 'fumadocs-mdx/next'
import type { NextConfig } from 'next'

const withMDX = createMDX()

const config: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true
  },

  // biome-ignore lint/suspicious/useAwait: rewrite is async
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/:path*'
      },
      {
        source: '/docs/:path*.md',
        destination: '/llms.mdx/:path*'
      }
    ]
  },

  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/docs/getting-started',
        permanent: true
      },
      {
        source: '/blog',
        destination: '/blog/swr-1',
        permanent: true
      },
      {
        source: '/examples',
        destination: '/examples/basic',
        permanent: true
      },

      {
        source: '/fr-FR/:path*',
        destination: '/fr/:path*',
        permanent: true
      },
      {
        source: '/es-ES/:path*',
        destination: '/es/:path*',
        permanent: true
      },
      {
        source: '/pt-BR/:path*',
        destination: '/pt/:path*',
        permanent: true
      },
      {
        source: '/zh-CN/:path*',
        destination: '/zh/:path*',
        permanent: true
      }
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.vercel.com'
      },
      {
        protocol: 'https',
        hostname: 'placehold.co'
      }
    ]
  }
}

export default withMDX(config)
