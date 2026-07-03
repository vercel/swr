/** @type {import('next').NextConfig} */
const nextConfig = {
  // The e2e specs assert exact render counts and effect-driven render
  // histories, which StrictMode's dev-only double invocation would break.
  // Keep dev behavior aligned with the production build.
  reactStrictMode: false
}

module.exports = nextConfig
