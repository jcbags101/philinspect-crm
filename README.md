# PhilInspect CRM POC

A realistic CRM proof of concept built from a read-only product audit. The app uses entirely fictional demo data and does not contain source-system screenshots, credentials, or customer records.

Staging demo: [crm-symph-poc.vercel.app](https://crm-symph-poc.vercel.app)

## Demo scope

- Overview dashboard with live pipeline and activity metrics
- Leads, deals, brands, wiki, and unified inbox
- Meetings, recordings, proposals, and partnerships
- Users and role personas
- Revenue, billing plans, and product/service catalog
- Audit logs, integrations, responsive navigation, and CRM copilot mock
- Searchable data views and a kanban-style deal pipeline
- Neon Auth email/password sign-up, sign-in, protected routes, and workspace roles
- RelayDesk-style Messenger and Instagram mock inbox with four fictional accounts
- Persistent messages, delivery states, retry, assignment, unread state, tags, and internal notes
- A permanent demo safety indicator; no messaging provider SDK, iframe, or external send

## Stack

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS
- shadcn/Base UI components
- Drizzle ORM with Neon Postgres
- Neon Auth for staging identity and sessions
- Vercel Functions pool lifecycle support
- Vitest, ESLint, and production build verification
- Playwright Chromium smoke coverage

## Local setup

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

Use the PhilInspectCRM `staging` branch. Set a pooled Neon URL for
`POSTGRES_URL`, an unpooled URL for `DATABASE_URL_UNPOOLED`, the branch's
`NEON_AUTH_BASE_URL`, and a private `NEON_AUTH_COOKIE_SECRET` of at least 32
characters. Never point local or staging environments at the Neon primary
branch.

Integration tests use a separate Neon child branch. Set `TEST_DATABASE_URL`,
`TEST_DATABASE_BRANCH_ID`, and the exact marker
`TEST_DATABASE_TARGET=philinspect-crm-test` only in ignored local/CI secrets.
The harness refuses a missing marker or a URL that resolves to any configured
runtime database before it truncates application tables.

## Delivery model

- The current Vercel project is staging only.
- GitHub `staging` is the only deployed branch during the POC.
- The private source repository is `jcbags101/philinspect-crm`.
- `main`, the Neon primary branch, and a separate production Vercel project are
  reserved until an explicit go-live approval.
- The RelayDesk inbox is a persistent mock and never contacts a real messaging
  provider.

## Commands

```bash
npm run check       # lint, typecheck, tests, and production build
npm run test:unit   # isolated unit tests; no database required
npm run test:integration # migrations/reset checks against TEST_DATABASE_URL
npm run test:all    # unit and isolated integration tests
npm run test:e2e    # Chromium auth and inbox smoke suite
npm run db:generate # generate a Drizzle migration
npm run db:migrate  # apply migrations
npm run db:seed     # replace demo data with deterministic fixtures
npm run db:reset    # replace application demo data with deterministic fixtures
```

The product design and implementation plan are stored under [`docs/`](docs/).
