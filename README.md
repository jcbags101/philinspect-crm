# Symph CRM POC

A realistic CRM proof of concept built from a read-only product audit. The app uses entirely fictional demo data and does not contain source-system screenshots, credentials, or customer records.

## Demo scope

- Overview dashboard with live pipeline and activity metrics
- Leads, deals, brands, wiki, and unified inbox
- Meetings, recordings, proposals, and partnerships
- Users and role personas
- Revenue, billing plans, and product/service catalog
- Audit logs, integrations, responsive navigation, and CRM copilot mock
- Searchable data views and a kanban-style deal pipeline

## Stack

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS
- shadcn/Base UI components
- Drizzle ORM with Neon Postgres
- Vercel Functions pool lifecycle support
- Vitest, ESLint, and production build verification

## Local setup

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

Use a pooled Neon URL for `POSTGRES_URL` and an unpooled URL for `DATABASE_URL_UNPOOLED`.

## Commands

```bash
npm run check       # lint, typecheck, tests, and production build
npm run db:generate # generate a Drizzle migration
npm run db:migrate  # apply migrations
npm run db:seed     # replace demo data with deterministic fixtures
npm run db:reset    # migrate and reseed the demo database
```

The product design and implementation plan are stored under [`docs/`](docs/).
