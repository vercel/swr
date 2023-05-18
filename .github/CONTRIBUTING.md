# SWR Contribution Guidelines

Thank you for reading this guide and we appreciate any contribution.

## Ask a Question

You can use the repository's [Discussions](https://github.com/vercel/swr/discussions) page to ask any questions, post feedback, or share your experience on how you use this library.

## Report a Bug

Whenever you find something which is not working properly, please first search the repository's [Issues](https://github.com/vercel/swr/issues) page and make sure it's not reported by someone else already.

If not, feel free to open an issue with a detailed description of the problem and the expected behavior. And reproduction (for example a [CodeSandbox](https://codesandbox.io) link) will be extremely helpful.

## Request for a New Feature

For new features, it would be great to have some discussions from the community before starting working on it. You can either create an issue (if there isn't one) or post a thread on the [Discussions](https://github.com/vercel/swr/discussions) page to describe the feature that you want to have.

If possible, you can add another additional context like how this feature can be implemented technically, what other alternative solutions we can have, etc.

## Open a PR for Bugfix or Feature

### Local Development with Examples

To run SWR locally, you can start it with any example in the `examples` folder. You need to set up the example and run the command in the root directory for overriding SWR and its dependencies to local assets.

First of all, build SWR assets

```sh
corepack enable
corepack pnpm install

pnpm watch
```

Install dependency of the target example, for instance `examples/basic`:


```sh
# by default it will run next dev for the example
pnpm next dev examples/basic
```

All examples are built with Next.js, so Next.js commands are all supported:

```sh
# if you want to build and start
pnpm next build examples/basic
pnpm next start examples/basic
```
## Update Documentation

To update the [SWR Documentation](https://swr.vercel.app), you can contribute to the [website repository](https://github.com/vercel/swr-site).
