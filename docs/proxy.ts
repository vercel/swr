import { createI18nMiddleware } from 'fumadocs-core/i18n/middleware'
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation'
import {
  type NextRequest,
  NextResponse,
  type NextFetchEvent
} from 'next/server'
import { i18n } from '@/lib/geistdocs/i18n'

const { rewrite: rewriteLLM } = rewritePath('/docs/*path', '/llms.mdx/*path')

const proxy = createI18nMiddleware(i18n)

const combinedProxy = async (request: NextRequest, context: NextFetchEvent) => {
  // First, handle Markdown preference rewrites
  if (isMarkdownPreferred(request)) {
    const result = rewriteLLM(request.nextUrl.pathname)
    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl))
    }
  }

  // Fallback to i18n middleware
  return proxy(request, context)
}

export default combinedProxy

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, static assets, favicon, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
