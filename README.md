# BetterTodo

A fast, tactile, collaborative task and workflow management app built with React 19, TanStack Router, Convex, and Better Auth.

[Quick Start](#getting-started) · [Documentation](#documentation) · [Tech Stack](#tech-stack)

---

## Highlights

- **Kanban & 2-Column Inspector** – Fluid drag-and-drop (`@hello-pangea/dnd`) with accessible drag handles, spring animations, list duplication, inline title/description editing, and tactile "Mark Complete" pills.
- **Universal Share Links** – Role-based invite links (`Member` or `Viewer` read-only) with public preview and auto-acceptance for guests and existing users.
- **Team Workspaces** – Multi-tenant workspace grouping with email invites, role management (`Owner`, `Admin`, `Member`), and centralized board ownership.
- **Custom Fields & Automations** – 5 field types (Text, Number, Date, Select, Checkbox) and automated due-date reminders via background cron jobs.
- **Batch Board Management** – Bulk selection, batch deletion, single-click deletion, and JSON board export/import.
- **Admin Dashboard & RBAC** – Role governance with pre-flight confirmation dialogs, user directory, and isolated admin bootstrapping.
- **Real-Time & PWA** – Reactive subscriptions via Convex, installable PWA with offline readiness, and animated theme toggler.
- **Hardened Security** – Internal mutation protection, cross-board boundary checks, HTML email sanitization, and indexed rate limiting.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TanStack Router, Vite, TailwindCSS, shadcn/ui |
| **Backend & Realtime** | Convex (BaaS) |
| **Authentication** | Better Auth (Email/Password + Google OAuth) |
| **Transactional Email** | Resend |
| **Drag & Drop** | `@hello-pangea/dnd` |
| **Monorepo Engine** | Turborepo + Bun |

## Getting Started

### 1. Install & Setup
```bash
bun install
bun run dev:setup
```

### 2. Configure Environment
Set required Convex environment variables (via CLI or Convex Dashboard):
```bash
npx convex env set SITE_URL "http://localhost:3001"
npx convex env set GOOGLE_CLIENT_ID "your-google-client-id"
npx convex env set GOOGLE_CLIENT_SECRET "your-google-client-secret"
npx convex env set RESEND_API_KEY "re_your_resend_api_key"
npx convex env set FROM_EMAIL "noreply@yourdomain.com"
```

For Google OAuth, configure your redirect URI in Google Cloud Console:
- `https://<your-deployment>.convex.site/api/auth/callback/google`

### 3. Run Development
```bash
bun run dev
```
- **Web App**: [http://localhost:3001](http://localhost:3001)
- **Documentation**: [http://localhost:4000](http://localhost:4000)

> **First Admin Setup**: Sign in to create an account, copy your `userId` from Convex Dashboard (`users` table), and run internal mutation `auth:createAdmin` to grant admin privileges.

## Common Scripts

| Command | Description |
| :--- | :--- |
| `bun run dev` | Start web app & Convex backend concurrently |
| `bun run build` | Build all workspace applications |
| `bun run check-types` | Run type checking across all workspace packages |
| `bun run test` | Run complete test suite (unit, integration, E2E) |
| `cd apps/fumadocs && bun run dev` | Start Fumadocs documentation server |

## Documentation

Comprehensive guides, API references, and architecture docs are built with [Fumadocs](https://fumadocs.dev) in `apps/fumadocs`:

- [Getting Started](apps/fumadocs/content/docs/getting-started.mdx) · [Authentication](apps/fumadocs/content/docs/authentication.mdx) · [Boards & Cards](apps/fumadocs/content/docs/boards-and-cards.mdx)
- [Workspaces](apps/fumadocs/content/docs/workspaces.mdx) · [Sharing & Collaboration](apps/fumadocs/content/docs/sharing-and-collaboration.mdx) · [Admin](apps/fumadocs/content/docs/admin.mdx) · [Security](apps/fumadocs/content/docs/security.mdx)

## License

MIT
