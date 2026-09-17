# BetterTodo Documentation

Documentation for [BetterTodo](../../README.md), built with [Fumadocs](https://fumadocs.dev) and Next.js.

## Run Locally

```bash
bun install
bun run dev
```

Open [http://localhost:4000](http://localhost:4000) in your browser.

## Content Structure

| Path | Description |
| --- | --- |
| `content/docs/index.mdx` | Introduction & feature overview |
| `content/docs/getting-started.mdx` | Setup, installation, environment & first admin |
| `content/docs/authentication.mdx` | Authentication (email/password & Google OAuth) |
| `content/docs/boards-and-cards.mdx` | Kanban boards, lists, 2-column card inspector & batch ops |
| `content/docs/workspaces.mdx` | Team workspaces, membership & role management |
| `content/docs/sharing-and-collaboration.mdx` | Universal share links, email invites & role permissions |
| `content/docs/admin.mdx` | Admin management panel, role promotions & confirmations |
| `content/docs/security.mdx` | Security architecture, validations, sanitization & audit |

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

3. If desired, configure page ordering in `content/docs/meta.json`.

## Learn More

- [Fumadocs Documentation](https://fumadocs.dev)
- [Next.js Documentation](https://nextjs.org/docs)
