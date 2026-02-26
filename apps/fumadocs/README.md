# BetterTodo Documentation

Documentation for [BetterTodo](../README.md), built with [Fumadocs](https://fumadocs.dev) and Next.js.

## Run Locally

```bash
bun install
bun run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

## Content Structure

| Path                                | Description                 |
| ----------------------------------- | --------------------------- |
| `content/docs/index.mdx`            | Introduction                |
| `content/docs/getting-started.mdx`  | Setup, install, run         |
| `content/docs/authentication.mdx`   | Auth (email + Google OAuth) |
| `content/docs/boards-and-cards.mdx` | Boards, lists, cards        |

## Add a New Page

1. Create an `.mdx` file in `content/docs/` (e.g. `content/docs/my-page.mdx`).
2. Add frontmatter:

```mdx
---
title: My Page
description: Brief description
---

# My Page

Content...
```

The sidebar is auto-generated from the file structure.

## Learn More

- [Fumadocs Documentation](https://fumadocs.dev)
- [Next.js Documentation](https://nextjs.org/docs)
