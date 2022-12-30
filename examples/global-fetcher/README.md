# Global Fetcher

## One-Click Deploy

Deploy your own SWR project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?s=https://github.com/vercel/swr/tree/main/examples/global-fetcher)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/vercel/swr/tar.gz/main | tar -xz --strip=2 swr-main/examples/global-fetcher
cd global-fetcher
```

Install it and run:

```bash
yarn
yarn dev
# or
npm install
npm run dev
```

## The Idea behind the Example

Use the `SWRConfig` provider to set up the fetcher globally instead of a per-hook call.
