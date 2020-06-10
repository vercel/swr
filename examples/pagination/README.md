# Pagination

## One-Click Deploy

Deploy your own SWR project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/project?template=https://github.com/vercel/swr/tree/master/examples/pagination)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/vercel/swr/tar.gz/master | tar -xz --strip=2 swr-master/examples/pagination
cd pagination
```

Install it and run:

```bash
yarn
yarn dev
# or
npm install
npm run dev
```

Deploy it to the cloud with [now](https://vercel.com/home) ([download](https://vercel.com/download))

```
now
```

## The Idea behind the Example

Show how to use the `useSWRPages` hook to consume paginated data from an API.
