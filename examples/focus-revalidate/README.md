# Focus Revalidate

## One-Click Deploy

Deploy your own SWR project with Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/project?template=https://github.com/vercel/swr/tree/main/examples/focus-revalidate)

## How to Use

Download the example:

```bash
curl https://codeload.github.com/vercel/swr/tar.gz/main | tar -xz --strip=2 swr-main/examples/focus-revalidate
cd focus-revalidate
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

Basic authentication example showing how the revalidate on focus feature works and to trigger a revalidation in a per hook call basis.
