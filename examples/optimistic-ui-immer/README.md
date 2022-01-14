# Optimistic UI with Immer

## One-Click Deploy

Deploy your own SWR project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?s=https://github.com/vercel/swr/tree/main/examples/optimistic-ui-immer)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/vercel/swr/tar.gz/main | tar -xz --strip=2 swr-main/examples/optimistic-ui-immer
cd optimistic-ui-immer
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

Example of how to use SWR and Immer to implement an Optimistic UI pattern where we mutate the cached data immediately and then trigger a revalidation with the API.
