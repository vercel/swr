# Server Render

## One-Click Deploy

Deploy your own SWR project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?s=https://github.com/vercel/swr/tree/main/examples/server-render)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/vercel/swr/tar.gz/main | tar -xz --strip=2 swr-main/examples/server-render
cd server-render
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

This examples show how to combine Next.js getServerSideProps with the SWR `fallbackData` option to support Server-Side Rendering.

The application will fetch the data server-side and then receive it as props, that data will be passed as `fallbackData` to SWR, once the application starts client-side SWR will revalidate it against the API and update the DOM, if it's required, with the new data.
