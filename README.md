# BetterTodo

A modern, full-featured collaborative task management application inspired by Trello, built with React 19, TanStack Router, Convex, and Better Auth.

## Features

- **Kanban Boards & Workflows** – Fluid drag-and-drop cards and columns powered by `@hello-pangea/dnd`, with dedicated drag handles (`GripVertical`), spring-pop column animations, and list duplication (including cards, checklists, and labels).
- **Modern 2-Column Card Inspector** – Spacious left workspace (edge-to-edge cover banners, inline auto-saving title, markdown description, checklists, threaded comments) paired with a streamlined 270px inspector sidebar (status, priority, due date, custom fields, attachments, actions).
- **Inline Editing & Tactile Controls** – Instant inline editing for card titles and descriptions (`Enter` / `Cmd+Enter` to save, `Esc` to cancel), interactive "Mark Complete" pill toggle, and micro-interactions on buttons.
- **Universal Share Links & Public Invites** – Generate role-specific invite links (Member or Viewer) with a public token acceptance flow (`/invite/$token`) supporting both authenticated users and guest sign-up auto-acceptance.
- **Workspaces** – Multi-tenant workspace grouping for boards with dedicated workspace settings (`/workspaces/$workspaceId`), member invitation by email, role management (Owner, Admin, Member), and workspace deletion.
- **Role-Based Access Control** – Granular permissions across Owner, Admin, Member, and Viewer modes (read-only board and card experience).
- **Batch Board Management** – "Manage Boards" mode on the boards page with multi-select of owned boards, "Select all owned", bulk deletion confirmation, and direct single-board deletion.
- **Custom Fields** – Board-level custom fields supporting 5 types: Text, Number, Date, Select (dropdown), and Checkbox, with empty-state auto-hiding and type tooltips.
- **Automation Rules** – Board-level due date reminder automation processed automatically via Convex scheduled background cron jobs every 15 minutes.
- **Import & Export** – Full board backup export to JSON and structured import into fresh boards.
- **Admin Dashboard** – Dedicated admin panel (`/admin`) with user listing, role management (User vs Admin) with confirmation dialogs, user deletion, and secure initial admin bootstrapping.
- **Real-Time Reactivity** – Automatic real-time state synchronization across all connected clients via Convex subscriptions.
- **Notifications & Emails** – In-app notification popover with unread badges, plus transactional emails via Resend for board invites and member assignments.
- **Progressive Web App (PWA)** – Installable PWA support with web manifest, offline readiness, and custom app icons.
- **Dark & Light Mode** – Animated theme toggle with system preference support and tactile scale feedback.
- **Security & Data Integrity** – Internal mutation isolation for notifications, cross-board boundary checks, HTML email sanitization, relative URL verification, rate limiting, and safe redirect preservation.

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 19, TanStack Router, Vite, TailwindCSS, shadcn/ui |
| **Backend & Realtime** | Convex (BaaS) |
| **Authentication** | Better Auth (Email & Password + Google OAuth) |
| **Transactional Email** | Resend |
| **Drag & Drop** | `@hello-pangea/dnd` |
| **UI Polish & Animations** | Aceternity UI, TailwindCSS Keyframes, Emil Kowalski design engineering principles |
| **Documentation** | Fumadocs + Next.js |
| **Monorepo Engine** | Turborepo + Bun |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Convex

Run the setup script to create and connect your Convex project:

```bash
bun run dev:setup
```

### 3. Environment Configuration

Copy environment variables from `packages/backend/.env.local` to `apps/web/.env` if needed, then set required Convex environment variables via the Convex Dashboard or CLI:

```bash
npx convex env set SITE_URL "http://localhost:3001"
npx convex env set GOOGLE_CLIENT_ID "your-google-client-id"
npx convex env set GOOGLE_CLIENT_SECRET "your-google-client-secret"
npx convex env set RESEND_API_KEY "re_your_resend_api_key"
npx convex env set FROM_EMAIL "noreply@yourdomain.com"
```

For Google OAuth, configure your redirect URI in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- `https://<your-deployment>.convex.site/api/auth/callback/google`

### 4. Create the First Admin

1. Sign in to the local app to create your user account.
2. Open the [Convex Dashboard](https://dashboard.convex.dev) for your project.
3. Under **Data**, copy your `_id` from the `users` table.
4. Under **Functions**, select the `auth:createAdmin` internal mutation and run it with `{ "userId": "<your-user-id>" }`.
5. Once granted Admin role, you can manage user roles and permissions directly in the app at `/admin`.

### 5. Run Development

```bash
bun run dev
```

- **Web App**: [http://localhost:3001](http://localhost:3001)
- **Documentation**: [http://localhost:4000](http://localhost:4000)

## Project Structure

```
BetterTodo/
├── apps/
│   ├── web/                     # React frontend (Vite + TanStack Router)
│   │   ├── src/
│   │   │   ├── components/      # Board, Card, List, Workspace, Admin, UI components
│   │   │   ├── routes/          # TanStack Router file-based routes
│   │   │   │   ├── index.tsx                # Public landing page
│   │   │   │   ├── sign-in.tsx              # Sign in page
│   │   │   │   ├── sign-up.tsx              # Sign up page
│   │   │   │   ├── dashboard.tsx            # Personal task dashboard
│   │   │   │   ├── boards/index.tsx         # Boards list & batch management
│   │   │   │   ├── boards/$boardId.tsx      # Kanban board view
│   │   │   │   ├── workspaces/$workspaceId.tsx # Workspace settings & members
│   │   │   │   ├── invite.$token.tsx        # Public share link acceptance
│   │   │   │   └── admin.tsx                # Admin management panel
│   │   │   ├── lib/             # Auth client, utils, constants
│   │   │   └── types/           # Shared TypeScript interfaces
│   │   └── pwa-assets.config.ts # PWA asset generation config
│   └── fumadocs/                # Documentation site (Fumadocs + Next.js)
│       └── content/docs/        # MDX documentation pages
├── packages/
│   ├── backend/                 # Convex backend
│   │   └── convex/
│   │       ├── auth.ts          # Better Auth setup & admin bootstrap
│   │       ├── automations.ts   # Due date reminder logic
│   │       ├── boards.ts        # Board CRUD, members, universal share links
│   │       ├── cards.ts         # Card CRUD, move, assignments, integrity checks
│   │       ├── lists.ts         # List CRUD, ordering, duplication
│   │       ├── workspaces.ts    # Workspace CRUD, membership, role management
│   │       ├── customFields.ts  # Custom field definitions & card values
│   │       ├── importExport.ts  # Scoped board export & JSON import
│   │       ├── emails.ts        # Resend actions with HTML sanitization
│   │       ├── notifications.ts # Internal notification mutations
│   │       ├── permissions.ts   # RBAC checks & indexed rate limiting
│   │       └── schema.ts        # Convex database schema
│   ├── config/                  # Shared TypeScript configuration
│   └── env/                     # Shared environment schema
└── tests/                       # Unit, integration, and E2E smoke tests
```

## Available Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start web app and Convex backend concurrently |
| `bun run build` | Build all workspace applications |
| `bun run dev:web` | Start only the web application |
| `bun run dev:setup` | Setup and initialize Convex project |
| `bun run check-types` | Run type checking across all workspace packages |
| `bun run test` | Run complete test suite (unit, integration, E2E) |
| `bun run test:unit` | Run unit tests |
| `bun run test:integration` | Run integration tests |
| `bun run test:e2e` | Run E2E smoke tests |
| `cd apps/web && bun run generate-pwa-assets` | Generate PWA icons and splash screens |
| `cd apps/fumadocs && bun run dev` | Start Fumadocs documentation server |

## Documentation

Comprehensive guides, API references, and architecture docs are built with [Fumadocs](https://fumadocs.dev) in `apps/fumadocs`. Run `cd apps/fumadocs && bun run dev` and open [http://localhost:4000](http://localhost:4000).

- [Getting Started](apps/fumadocs/content/docs/getting-started.mdx)
- [Authentication & Roles](apps/fumadocs/content/docs/authentication.mdx)
- [Boards, Lists & Cards](apps/fumadocs/content/docs/boards-and-cards.mdx)
- [Workspaces](apps/fumadocs/content/docs/workspaces.mdx)
- [Sharing & Collaboration](apps/fumadocs/content/docs/sharing-and-collaboration.mdx)
- [Admin Management](apps/fumadocs/content/docs/admin.mdx)
- [Security & Architecture](apps/fumadocs/content/docs/security.mdx)

## Security

Security protections include row-level access control, internal mutation isolation for privileged operations, cross-board relationship validation, HTML sanitization in email templates, safe relative-path redirection, and rate limiting backed by indexed lookups. Detailed documentation is in [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md) and [`apps/fumadocs/content/docs/security.mdx`](apps/fumadocs/content/docs/security.mdx).

## License

MIT
