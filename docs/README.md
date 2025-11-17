# Geistdocs

A modern documentation template built with Next.js and [Fumadocs](https://fumadocs.dev). Designed for spinning up Vercel documentation sites quickly and consistently with built-in AI chat, GitHub discussions integration, and a beautiful UI.

## Features

- 📝 **MDX-powered documentation** - Write docs in MDX with full component support
- 🤖 **AI-powered chat** - Built-in AI assistant that understands your documentation
- 💬 **GitHub Discussions integration** - Allow users to provide feedback directly to GitHub
- 🎨 **Modern UI** - Beautiful, accessible components built with Radix UI
- 🔍 **Advanced search** - Fast, fuzzy search through all documentation
- 🌙 **Dark mode** - Built-in theme switching
- 📱 **Responsive** - Mobile-first design that works everywhere
- ⚡ **Fast** - Built on Next.js 16 with App Router for optimal performance
- 📰 **RSS** - Built-in RSS feed for your documentation

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (recommended) or npm
- A GitHub repository for documentation content
- A GitHub App for discussions integration (optional)

### Installation

1. Create a new repository using this template:

```bash
gh repo create mydocs --template vercel/geistdocs --clone
cd mydocs
```

2. Install dependencies:

```bash
pnpm install
```

3. Configure environment variables (see [Environment Variables](#environment-variables) below)

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

### Required Variables

```bash
# GitHub Repository Configuration
# The owner of the GitHub repository (organization or username)
NEXT_PUBLIC_GEISTDOCS_OWNER=your-github-username

# The name of your GitHub repository
NEXT_PUBLIC_GEISTDOCS_REPO=your-repo-name

# The name of the GitHub Discussions category for feedback
NEXT_PUBLIC_GEISTDOCS_CATEGORY=Documentation

# GitHub App Credentials (for discussions integration)
# Create a GitHub App at: https://github.com/settings/apps/new
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# AI Gateway API Key (for AI chat functionality)
# This is typically an OpenAI API key or compatible AI gateway
AI_GATEWAY_API_KEY=your-api-key

# Production URL (set automatically on Vercel)
NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL=yourdomain.com
```

### Setting Up GitHub App

To enable the feedback feature that creates GitHub Discussions:

1. Go to [GitHub Apps settings](https://github.com/settings/apps/new)
2. Create a new GitHub App with the following permissions:
   - Repository permissions:
     - Discussions: Read and write
   - Subscribe to events: Discussions
3. Generate a private key and save it
4. Install the app on your documentation repository
5. Add the App ID and private key to your `.env.local`

### Setting Up AI Chat

The AI chat feature uses the Vercel AI SDK with OpenAI:

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it as `AI_GATEWAY_API_KEY` in your `.env.local`
3. The chat will automatically search and answer questions about your documentation

## Project Structure

```
geistdocs/
├── app/
│   ├── (home)/          # Landing page and marketing content
│   ├── docs/            # Documentation pages
│   ├── api/
│   │   ├── chat/        # AI chat API endpoint
│   │   └── search/      # Search API endpoint
│   └── actions/         # Server actions (e.g., GitHub discussions)
├── components/
│   ├── geistdocs/       # Custom Geistdocs components
│   └── ui/              # Reusable UI components
├── content/             # MDX documentation content
├── lib/
│   ├── source.ts        # Content source adapter
│   └── layout.shared.tsx # Shared layout configuration
└── source.config.ts     # Fumadocs MDX configuration
```

## Writing Documentation

Documentation is written in MDX format in the `content/` directory. Each file can include:

- **Frontmatter** - Metadata like title, description, and more
- **MDX components** - Use React components directly in your markdown
- **Code blocks** - Syntax-highlighted code with Shiki

Example:

```mdx
---
title: Getting Started
description: Learn how to get started with Geistdocs
---

# Getting Started

Welcome to the documentation!

<Callout type="info">
  This is a custom component you can use in your docs.
</Callout>
```

## Customization

### Styling

The project uses Tailwind CSS 4. Customize the theme in `tailwind.config.ts` and global styles in `app/globals.css`.

### Components

Add custom components to `components/geistdocs/` and import them in your MDX files.

### Layout

Modify the shared layout options in `lib/layout.shared.tsx` to customize the sidebar, navigation, and more.

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Format code
pnpm format
```

## Code Quality

This project uses [Ultracite](https://github.com/haydenbleasel/ultracite), a zero-config Biome preset for TypeScript/React projects. All code is automatically formatted and linted with strict rules for:

- Type safety
- Accessibility
- Performance
- React best practices

Run `pnpm lint` to check for issues and `pnpm format` to auto-fix formatting.

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vercel/geistdocs)

1. Click the "Deploy" button above
2. Configure your environment variables in the Vercel dashboard
3. Deploy!

### Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Node.js:

1. Build the application: `pnpm build`
2. Start the server: `pnpm start`
3. Ensure all environment variables are set

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Fumadocs](https://fumadocs.dev) - Learn about Fumadocs
- [Ultracite](https://github.com/haydenbleasel/ultracite) - Learn about code quality standards

## License

MIT
