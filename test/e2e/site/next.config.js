/** @type {import('next').NextConfig} */
const nextConfig = {
  // The e2e specs assert exact render counts and effect-driven render
  // histories, which StrictMode's dev-only double invocation would break.
  // Keep dev behavior aligned with the production build.
  reactStrictMode: false,
  experimental: {
    // TypeScript 7 dropped the JavaScript compiler API that Next.js uses for
    // type checking, so drive the `tsc` CLI instead.
    useTypeScriptCli: true
  }
}

module.exports = nextConfig
