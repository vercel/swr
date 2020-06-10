# API Hooks

## One-Click Deploy

Deploy your own SWR project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/project?template=https://github.com/vercel/swr/tree/master/examples/focus-revalidate)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/vercel/swr/tar.gz/master | tar -xz --strip=2 swr-master/examples/api-hooks
cd api-hooks
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

Show how you could create custom hooks, using SWR internally, for your different data requirements and use them in your application.
