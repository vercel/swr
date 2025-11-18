import Link from 'next/link'
import { blogSource } from '@/lib/geistdocs/source'

type BlogIndexProps = {
  params: Promise<{ lang: string }>
}

const BlogIndex = async ({ params }: BlogIndexProps) => {
  const { lang } = await params

  // Get all pages and filter for blog posts in the current locale
  const blogPages = blogSource.getPages(lang).filter(page => {
    // Check if the page URL includes /blog/
    const isBlogPost = page.url.includes('/blog/')

    return isBlogPost
  })

  return (
    <div>
      <h1 className="text-4xl tracking-tighter text-center font-extrabold md:text-5xl mt-8 pb-6">
        SWR Blog
      </h1>
      {blogPages.map(page => (
        <div key={page.url} className="mb-10">
          <h3>
            <Link
              href={page.url}
              style={{ color: 'inherit', textDecoration: 'none' }}
              className="block font-semibold mt-8 text-2xl "
            >
              {page.data.title}
            </Link>
          </h3>
          {page.data.description && (
            <p className="opacity-80 mt-6 leading-7">
              {page.data.description}{' '}
              <span className="inline-block">
                <Link
                  href={page.url}
                  className="text-[hsl(var(--nextra-primary-hue),100%,50%)] underline underline-offset-2 decoration-from-font"
                >
                  Read more →
                </Link>
              </span>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export default BlogIndex
