# API Hooks

## One-Click Deploy

Deploy your own SWR project with ZEIT Now.

[![Deploy with ZEIT Now](https://zeit.co/button)](https://zeit.co/new/project?template=https://github.com/zeit/swr/tree/master/examples/focus-revalidate)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/zeit/swr/tar.gz/master | tar -xz --strip=2 swr-master/examples/api-hooks
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

Deploy it to the cloud with [now](https://zeit.co/home) ([download](https://zeit.co/download))

```
now
```

## The Idea behind the Example

Show how you could create custom hooks, using SWR internally, for your different data requirements and use them in your application.
