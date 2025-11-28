import { getLLMText, source } from '@/lib/geistdocs/source'

export const revalidate = false

export const GET = async () => {
  const scan = source.getPages('en-US').map(getLLMText)
  const scanned = await Promise.all(scan)

  return new Response(scanned.join('\n\n'))
}
