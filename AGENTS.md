# AGENTS.md

Welcome to BetterTodo! This file provides guidance, architecture context, and operational guidelines for AI coding agents working on this repository.

---

## 1. Project Overview & Architecture

BetterTodo is a fast, tactile, collaborative task and workflow management system organized as a Turborepo monorepo powered by Bun.

### Workspace Structure
- **`apps/web`**: Single-page application built with React 19, Vite, TanStack Router (file-based routing in `src/routes`), Tailwind CSS v4, and Radix UI / shadcn primitives.
- **`packages/backend`**: Convex backend functions (`convex/`), schema definitions (`convex/schema.ts`), authentication adapter (`convex/auth.ts`), and permission validators (`convex/permissions.ts`).
- **`apps/fumadocs`**: Product and developer documentation built with Fumadocs.
- **`packages/config` / `packages/env`**: Shared TypeScript configuration and environment variable validators.

---

## 2. Core Conventions & Standards

### Package Manager & Scripts
Always use **`bun`** (do not use `npm` or `yarn`):
- `bun run dev` – Launch dev servers (web + convex)
- `bun run check-types` – Run TypeScript type checking across all workspace packages via `turbo check-types`
- `bun run test` – Run test suites (unit, integration, smoke) via `bun test`
- `bun run build` – Build all applications for production

### Frontend Conventions (`apps/web`)
- **React 19 & Hooks**: Avoid legacy patterns. Use React hooks, `useMemo`, `useCallback`, and Convex reactive queries (`useQuery`, `useMutation`).
- **Styling**: Tailwind CSS v4 utility classes. Prefer semantic tokens (`text-muted-foreground`, `bg-card`, `border-border`, etc.) to guarantee seamless dark/light mode compatibility.
- **Micro-interactions & UX**: Adhere to clean design guidelines—proper optical alignment, concentric border radii, subtle focus/hover rings, and defensive UI against string overflow (`truncate`, `max-w-*`, `break-words`).
- **Icons**: Use `lucide-react`.

### Backend Conventions (`packages/backend/convex`)
- **Convex Zen Philosophy**: Keep functions pure and deterministic. Never expose unscoped queries/mutations that could bypass tenancy or access boundaries.
- **Permission Checks**: Always use permission helpers from `packages/backend/convex/permissions.ts` (`ensureBoardReadAccessForQuery`, `ensureBoardRole`, `ensureListWriteAccess`, `requireAuth`).
- **Data Hydration**: For nested board/card relations (such as labels, checklist items, members), prefer batch lookups or in-query map indexing to avoid N+1 waterfalls.

---

## 3. Key Entities & Flows

### Boards & Lists
- Boards contain Lists ordered by `position`.
- Lists can be archived or duplicated; archived lists are excluded from active board views and stored with `archived: true`.
- Board permissions: `owner`, `admin`, `member`, `viewer`.

### Cards & Labels
- Cards belong to Lists and inherit the Board context.
- Cards feature markdown descriptions, cover images, due dates (with dynamic urgency statuses: overdue, today, tomorrow, upcoming, completed), checklists, custom fields, attachments, and threaded comments.
- Board labels are defined on the board level and linked to cards through the `cardLabels` join table. Long label names must always be truncated with appropriate tooltips or titles.

### Comments & Mentions
- Cards support threaded replies and `@member` autocomplete.
- Comment containers maintain defined scroll boundaries with smooth-scrolling on submission.

### Archived Items Panel
- Accessible via board header or settings.
- Manages archived **Cards**, **Lists**, and **Boards** with granular restore and permanent deletion operations.

---

## 4. Verification Checklist for Agents

Before completing any task or opening a pull request, always verify:
1. `bun run check-types` passes with zero errors.
2. `bun run test` passes all tests.
3. No unintended files (e.g. temporary logs, local skill definitions) are staged or committed.
4. Git commit messages follow standard semantic conventions (`feat:`, `fix:`, `refactor:`, `docs:`).
