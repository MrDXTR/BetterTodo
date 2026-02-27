# BetterTodo

A Trello-like collaborative task management app built with React, TanStack Router, Convex, and Better Auth.

## Features

- **Kanban Boards** – Drag-and-drop cards across lists. Visualize your workflow at a glance.
- **Collaboration** – Invite teammates, assign cards, and work together in real time.
- **Cards** – Titles, descriptions, due dates, priorities, labels, checklists, and member assignments.
- **Authentication** – Email/password and Google OAuth via Better Auth.
- **Email Notifications** – Transactional emails for board invites and @mentions via Resend.
- **Real-time** – Convex-powered reactive updates across all clients.
- **PWA** – Progressive Web App support for install and offline readiness.
- **Dark/Light Mode** – Theme toggle with system preference support.

## Tech Stack

| Layer       | Tech                                              |
| ----------- | ------------------------------------------------- |
| Frontend    | React 19, TanStack Router, TailwindCSS, shadcn/ui |
| Backend     | Convex (BaaS)                                     |
| Auth        | Better Auth (email + Google OAuth)                |
| Emails      | Resend                                            |
| Drag & Drop | @hello-pangea/dnd                                 |
| Monorepo    | Turborepo                                         |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)

### Install Dependencies

```bash
bun install
```

### Convex Setup

1. Run the setup script to create and connect a Convex project:

```bash
bun run dev:setup
```

2. Copy environment variables from `packages/backend/.env.local` into `apps/web/.env` if needed.

3. Set Convex environment variables for auth (via Convex Dashboard or CLI):

```bash
npx convex env set SITE_URL "http://localhost:3001"
npx convex env set GOOGLE_CLIENT_ID "your-google-client-id"
npx convex env set GOOGLE_CLIENT_SECRET "your-google-client-secret"
npx convex env set RESEND_API_KEY "re_your_resend_api_key"
npx convex env set FROM_EMAIL "noreply@yourdomain.com"
```

5. **Create the First Admin**

Once your app is running, sign in to create a user. Then, go to the [Convex Dashboard](https://dashboard.convex.dev) -> **Functions** and run the `auth:createAdmin` internal mutation with your `userId` to grant yourself admin privileges.

6. For Google OAuth, add this redirect URI in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
    - `https://<your-deployment>.convex.site/api/auth/callback/google`

### Run Development

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
BetterTodo/
├── apps/
│   ├── web/              # React frontend (Vite + TanStack Router)
│   │   └── src/
│   │       ├── components/   # Board, Card, List, UI components
│   │       ├── routes/       # TanStack Router routes
│   │       ├── lib/          # Auth client, utils, constants
│   │       └── types/        # Shared TypeScript types
│   └── fumadocs/         # Documentation (Fumadocs + Next.js)
├── packages/
│   ├── backend/          # Convex backend
│   │   └── convex/
│   │       ├── auth.ts       # Better Auth config (email + Google)
│   │       ├── boards.ts     # Board CRUD, members
│   │       ├── lists.ts      # List CRUD, positions
│   │       ├── cards.ts      # Card CRUD, assignments, move
│   │       ├── labels.ts     # Label CRUD
│   │       ├── checklists.ts # Checklist CRUD
│   │       ├── comments.ts   # Comment CRUD
│   │       ├── emails.ts     # Resend email actions and templates
│   │       ├── notifications.ts
│   │       └── schema.ts     # Convex schema
│   ├── config/           # Shared TypeScript config
│   └── env/              # Environment schema
└── task.md               # Development task tracker
```

## Available Scripts

| Script                                       | Description                        |
| -------------------------------------------- | ---------------------------------- |
| `bun run dev`                                | Start all apps (web + Convex)      |
| `bun run build`                              | Build all applications             |
| `bun run dev:web`                            | Start only the web app             |
| `bun run dev:setup`                          | Setup and configure Convex project |
| `bun run check-types`                        | Type-check all packages            |
| `cd apps/web && bun run generate-pwa-assets` | Generate PWA assets                |

## Documentation

Documentation is built with [Fumadocs](https://fumadocs.dev) and lives in `apps/fumadocs`. To run the docs locally:

```bash
cd apps/fumadocs && bun run dev
```

Open [http://localhost:4000](http://localhost:4000) for the docs.

## License

MIT
