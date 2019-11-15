# Prefetch & Preload

## One-Click Deploy

Deploy your own SWR project with ZEIT Now.

[![Deploy with ZEIT Now](https://zeit.co/button)](https://zeit.co/new/project?template=https://github.com/zeit/swr/tree/master/examples/prefetch-preload)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/zeit/swr/tar.gz/master | tar -xz --strip=2 swr-master/examples/prefetch-preload
cd prefetch-preload
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

This example showcase multiple ways to prefetch data to be used by SWR later.

- Use a `<link preload>` to get the browser load the data while rendering the HTML
- If in a browser, run the fetch + mutate outside the component
- After rendering use an effect in React to prefetch the next page data
- When the user moves the mouse over a link trigger a fetch + mutate for the next page

In real world you would not necessarily use all of them at the same time but one or more combined to give the best UX possible.
