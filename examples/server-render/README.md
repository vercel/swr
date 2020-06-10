# Server Render

## One-Click Deploy

Deploy your own SWR project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/project?template=https://github.com/vercel/swr/tree/master/examples/server-render)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/vercel/swr/tar.gz/master | tar -xz --strip=2 swr-master/examples/server-render
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

Deploy it to the cloud with [now](https://vercel.com/home) ([download](https://vercel.com/download))

```
now
```

## The Idea behind the Example

This examples show how to combine Next.js getServerSideProps with the SWR `initialData` option to support Server-Side Rendering.

The application will fetch the data server-side and then receive it as props, that data will be passed as `initialData` to SWR, once the application starts client-side SWR will revalidate it against the API and update the DOM, if it's required, with the new data.
