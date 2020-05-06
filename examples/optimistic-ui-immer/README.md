# Optimistic UI with Immer

## One-Click Deploy

Deploy your own SWR project with ZEIT Now.

[![Deploy with ZEIT Now](https://zeit.co/button)](https://zeit.co/new/project?template=https://github.com/zeit/swr/tree/master/examples/optimistic-ui-immer)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/zeit/swr/tar.gz/master | tar -xz --strip=2 swr-master/examples/optimistic-ui-immer
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

Deploy it to the cloud with [now](https://zeit.co/home) ([download](https://zeit.co/download))

```
now
```

## The Idea behind the Example

Example of how to use SWR and Immer to implement an Optimistic UI pattern where we mutate the cached data immediately and then trigger a revalidation with the API.
