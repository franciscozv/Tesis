# Frontend - Sistema IEP

Sistema de gestión para Iglesia Evangélica Pentecostal

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios
- **Package Manager:** pnpm

## Getting Started
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start
```

## Project Structure
```
src/
├── app/              # Next.js App Router
├── features/         # Feature-based modules
├── components/       # Shared components
├── lib/             # Utilities and configs
├── hooks/           # Global hooks
├── types/           # Global types
└── config/          # App configuration
```

## Features

Each feature module contains:
- `api/` - API calls
- `components/` - Feature-specific components
- `hooks/` - Custom hooks (React Query)
- `types/` - TypeScript types
- `schemas/` - Zod validation schemas
- `utils/` - Helper functions

## Development

- `pnpm dev` - Start dev server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format with Prettier
- `pnpm type-check` - Check TypeScript types

## Environment Variables

Copy `.env.example` to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
```

---

## **ESTRUCTURA FINAL**
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── features/
│   │   └── miembros/
│   │       ├── api/
│   │       │   └── index.ts
│   │       ├── components/
│   │       ├── hooks/
│   │       │   └── use-miembros.ts
│   │       ├── schemas/
│   │       │   └── index.ts
│   │       └── types/
│   │           └── index.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layouts/
│   │   └── common/
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── query-client.ts
│   │   └── utils.ts
│   ├── providers/
│   │   └── query-provider.tsx
│   ├── hooks/
│   ├── types/
│   └── config/
│       ├── site.ts
│       └── env.ts
├── public/
├── .env.example
├── .env.local
├── .eslintrc.json
├── .prettierrc
├── components.json
├── next.config.mjs
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md

