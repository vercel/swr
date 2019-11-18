# Server Render

## One-Click Deploy

Deploy your own SWR project with ZEIT Now.

[![Deploy with ZEIT Now](https://zeit.co/button)](https://zeit.co/new/project?template=https://github.com/zeit/swr/tree/master/examples/server-render)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/zeit/swr/tar.gz/master | tar -xz --strip=2 swr-master/examples/server-render
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

Deploy it to the cloud with [now](https://zeit.co/home) ([download](https://zeit.co/download))

```
now
```

## The Idea behind the Example

This examples show how to combine Next.js getInitialProps with the SWR `initialData` option to support Server-Side Rendering.

The application will fetch the data server-side and then receive it as props, that data will be passed as `initialData` to SWR, once the application starts client-side SWR will revalidate it against the API and update the DOM, if it's required, with the new data.
