# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start Next.js dev server
pnpm build            # Production build
pnpm lint             # Biome linter
pnpm lint:fix         # Biome linter with auto-fix
pnpm format           # Biome formatter
pnpm check            # Biome lint + format combined (preferred)
pnpm type-check       # TypeScript type checking (tsc --noEmit)
```

No test framework is configured yet.

## Tech Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript** (strict mode)
- **Tailwind CSS v4** for styling, **shadcn/ui** (New York style) for components
- **TanStack Query v5** for server state, **Axios** for HTTP
- **React Hook Form** + **Zod** for forms and validation
- **Biome** for linting/formatting (replaces ESLint + Prettier)
- **pnpm** as package manager

## Architecture

### Feature-Based Module Structure

Each feature lives in `src/features/<feature>/` with this layout:

```
features/<feature>/
  api/index.ts         # Axios CRUD functions (e.g., featureApi.getAll())
  hooks/use-<feature>.ts  # React Query hooks wrapping the API
  schemas/index.ts     # Zod validation schemas
  types/index.ts       # TypeScript interfaces
  components/          # Feature-specific UI components
```

Only `miembros` is implemented so far. Use it as the reference pattern when building new features. The backend exposes 17 modules total — see `API_ENDPOINTS.md` for all 89 endpoints and `VALIDACIONES.md` for backend validation schemas.

### API Layer

- `src/lib/api-client.ts` — Axios instance with base URL from `siteConfig.apiUrl`, JWT auto-attach from `localStorage('token')`, and 401 auto-redirect to `/login`
- Feature API modules return typed responses: `const { data } = await apiClient.get<Type>('/path')`

### React Query Pattern

- Hooks use a `QUERY_KEY` constant per feature for cache management
- Mutations invalidate relevant query keys on success
- Default config: 1min stale time, 1 retry on queries, no retry on mutations, no refetch on window focus (`src/lib/query-client.ts`)

### Form Pattern

1. Define Zod schema in `schemas/`
2. Infer TS type with `z.infer<typeof schema>`
3. Use `useForm` with `zodResolver(schema)`
4. Use shadcn `<Form>`, `<FormField>`, `<FormItem>`, `<FormMessage>` components

### Component Patterns

- Server Components by default; add `'use client'` only when hooks/interactivity needed
- shadcn/ui components in `src/components/ui/` — use CVA for variants, `cn()` for class merging
- Providers (React Query, themes) in `src/providers/`

## Code Style (Biome)

- 2-space indent, 100 char line width, LF line endings
- Single quotes (JS/TS), double quotes (JSX)
- Always semicolons, always trailing commas, always arrow parens
- Import alias: `@/*` → `src/*`

## Environment

Copy `.env.example` and set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001/api`). Env vars are validated with Zod in `src/config/env.ts`.

## Key Reference Docs

- `API_ENDPOINTS.md` — Complete backend API reference (89 endpoints, 17 modules, auth requirements, request/response examples)
- `VALIDACIONES.md` — All backend Zod validation schemas, field rules, enums, and business logic constraints
