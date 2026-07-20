# Symph CRM POC Implementation Plan

Date: 2026-07-20  
Based on: `../specs/2026-07-20-symph-crm-poc-design.md`  
Target application: `/Users/judebaguinang/code/personal-projects/crm-symph-poc`

## Outcome

Deliver a high-fidelity, interactive CRM demonstration covering every approved page and the complete lead-to-revenue workflow. The application will use Next.js, TypeScript, Tailwind CSS, Drizzle ORM, a free Neon Postgres database provisioned through Vercel, and Vercel hosting.

External communication and AI features remain simulated. The implementation must never use source CRM credentials or confidential source data.

## Delivery Order

The build follows six milestones:

1. Cloud and project foundation
2. Database and domain foundation
3. Shared interface and Core CRM
4. Engagement features
5. Business and System features
6. Verification and deployment

Each milestone must pass its checkpoint before work begins on the next milestone.

## Milestone 1: Cloud and Project Foundation

### Task 1.1 — Create the source repository

Create a new application directory and Git repository at `crm-symph-poc` rather than mixing application code with the screenshot audit.

Expected initial files:

```text
crm-symph-poc/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
├── .env.example
├── src/
├── scripts/
└── tests/
```

Actions:

- Scaffold Next.js with App Router, TypeScript, ESLint, Tailwind CSS, and `src/` layout.
- Set the supported Node.js version.
- Add scripts for development, linting, type checking, unit tests, end-to-end tests, Drizzle migration generation, migration execution, seeding, and database reset.
- Add `.env*` files to `.gitignore`.
- Document setup commands in `README.md`.

Verification:

- Development server renders locally.
- Lint and type-check commands pass.
- No credentials or database URLs are tracked by Git.

### Task 1.2 — Create Vercel and Neon resources

Cloud setup requires access to the selected Vercel account and organization.

Actions:

- Create a Vercel project linked to the new repository without performing the final production launch.
- Install the native Neon integration from the Vercel Marketplace.
- Select Neon's free plan.
- Create one Neon project for the POC.
- Connect the Neon database to Development, Preview, and Production Vercel environments.
- Standardize the runtime connection as `DATABASE_URL`.
- Preserve a direct/unpooled migration URL if the integration exposes one.
- Pull development environment variables locally through the supported Vercel workflow.
- Confirm the application can execute `select 1` through the Neon serverless driver.

Safeguards:

- Do not copy credentials into documentation, chat, screenshots, or commits.
- Keep the free plan's scale-to-zero behavior enabled.
- Do not enable paid resources or upgrades.

Verification:

- Local development connects to Neon.
- A Vercel preview function connects to Neon.
- No paid Neon or Vercel add-on is enabled.

### Milestone 1 checkpoint

- New repository exists and is clean.
- Vercel project and free Neon database are connected.
- Local and preview database connectivity are confirmed.
- Lint and type checking pass.

## Milestone 2: Database and Domain Foundation

### Task 2.1 — Install the data and validation toolchain

Core packages:

- `drizzle-orm`
- `drizzle-kit`
- `@neondatabase/serverless`
- `zod`
- A small date utility library if required
- Vitest for unit and integration tests
- Playwright for end-to-end tests

Create:

```text
src/db/client.ts
src/db/schema/
src/db/repositories/
src/server/services/
src/server/validation/
src/integrations/
scripts/seed.ts
scripts/reset-demo.ts
```

Verification:

- Drizzle client connects using `DATABASE_URL`.
- A test query runs in local development and Vercel Preview.

### Task 2.2 — Implement the schema in bounded modules

Schema files:

```text
src/db/schema/identity.ts
src/db/schema/crm.ts
src/db/schema/engagement.ts
src/db/schema/business.ts
src/db/schema/system.ts
src/db/schema/relations.ts
src/db/schema/index.ts
```

Tables:

- Identity: users, roles, user roles, demo sessions
- CRM: leads, brands, deals, stage history, activities, notes, attachments
- Engagement: channels, conversations, messages, meetings, recordings, proposals, proposal versions, partnership accounts and groups
- Business: catalog items, revenue targets, revenue entries, billing plans, billing milestones
- System: integration connections and audit logs

Schema requirements:

- UUID primary keys
- Foreign keys and useful indexes
- Currency code stored separately from numeric amounts
- Numeric/decimal types for money
- Enum or constrained values for deal stages and statuses
- `created_at`, `updated_at`, and appropriate `deleted_at` fields
- JSON fields only for bounded audit snapshots and mock integration fixture metadata

Verification:

- Generate and inspect SQL migrations.
- Apply migrations to an empty database.
- Run Drizzle schema type checking.
- Confirm foreign-key and uniqueness constraints with integration tests.

### Task 2.3 — Build deterministic fictional seed data

The seed should approximately reproduce the density of the captured screens while using fictional records:

- 10–15 users across the three roles
- 400 leads across the four visible segments
- 148 brands
- 163 deals distributed across all pipeline stages
- 9 catalog items across Products, Services, and Resellers
- Revenue targets and monthly revenue entries
- Three or more billing configurations
- Conversations and messages across every simulated channel
- Meetings, recordings, and proposals in each supported status
- Partnership accounts and groups
- At least 1,800 generated audit events for realistic pagination

The generator must use a fixed seed so names, dates, totals, and screenshots remain stable.

Verification:

- Running seed twice after reset produces identical record counts and fixture identifiers.
- Seeded organizations and people do not reuse confidential source data.
- Aggregate totals match documented fixture expectations.

### Task 2.4 — Implement repositories and domain services

Repository modules own database access. Service modules own business rules.

Required services:

- Demo session and role service
- Lead service and lead conversion transaction
- Brand service
- Deal pipeline service
- Activity/note/attachment service
- Conversation and message simulation service
- Meeting and recording fixture service
- Proposal lifecycle service
- Partnership service
- Catalog service
- Revenue calculation service
- Billing service
- Audit service
- Demo reset service

Rules:

- UI components never query Drizzle directly.
- Successful mutations create audit entries.
- Lead conversion is transactional.
- Role checks occur server-side inside services.
- Delete actions are soft deletes unless an explicit Admin permanent-delete path is invoked.

Verification:

- Unit tests cover service rules.
- Integration tests cover transactions and audit writes.
- Permission tests cover Account Manager, Sales, and Admin.

### Milestone 2 checkpoint

- Schema, migrations, seed, and reset are reproducible.
- Domain services pass unit and integration tests.
- No UI feature bypasses server-side permissions.

## Milestone 3: Shared Interface and Core CRM

### Task 3.1 — Build the application shell

Routes use a shared `(crm)` layout.

Create:

```text
src/app/(crm)/layout.tsx
src/components/shell/sidebar.tsx
src/components/shell/command-palette.tsx
src/components/shell/persona-switcher.tsx
src/components/shell/theme-toggle.tsx
src/components/shell/account-menu.tsx
src/components/shared/
```

Requirements:

- Match the captured dark desktop shell.
- Support full and collapsed sidebar states.
- Group navigation into Main, Engagement, Business, and System.
- Add command navigation and keyboard shortcut.
- Add role/persona switching.
- Provide reusable loading, empty, error, and permission-denied states.
- Add a persistent Demo indicator.

Verification:

- Keyboard and mouse navigation work.
- Persona switching updates server-readable session state.
- Visual comparison matches the reference shell.

### Task 3.2 — Build shared data components

Create reusable components for:

- KPI cards
- Filter chips and segmented tabs
- Search fields
- Sortable tables
- Pagination
- Status and stage badges
- Confirm dialogs
- Form dialogs
- Timeline/activity feed
- Money display with currency code
- Skeleton states

Verification:

- Components support keyboard navigation.
- Loading, zero-result, validation, and error states render consistently.

### Task 3.3 — Implement Dashboard

Route: `src/app/(crm)/page.tsx`

Deliver:

- Lifetime/month/year/currency controls
- KPI cards
- Pipeline-stage progress
- Top-deal ranking
- Account Manager leaderboard
- Recent activity
- Server-side aggregate queries

Verification:

- Dashboard totals change after mutations.
- Currency display changes without altering stored source amounts.
- Screenshot matches the reference structure.

### Task 3.4 — Implement Chat

Route: `src/app/(crm)/chat/page.tsx`

Deliver:

- Conversation list
- New-chat flow
- Prompt composer
- Deterministic simulated AI response stream
- Pipeline-summary, log-call, create-deal, and draft-email shortcuts

Verification:

- No external AI request occurs.
- Shortcuts create the expected local demo artifacts.
- Refreshing preserves chat history in Neon.

### Task 3.5 — Implement Leads

Route: `src/app/(crm)/leads/page.tsx`

Deliver:

- Counters, search, segment filters, status filter, table, pagination
- Create and edit dialogs
- Archive action
- Lead conversion wizard

Verification:

- Search and filters are shareable through URL parameters.
- Conversion creates linked brand and deal records exactly once.
- Conversion and archive actions appear in Audit Logs.

### Task 3.6 — Implement Deals

Routes:

```text
src/app/(crm)/deals/page.tsx
src/app/(crm)/deals/[dealId]/page.tsx
```

Deliver:

- Owner and category filters
- Search
- Board, list, and heatmap views
- Stage movement
- Deal detail with activities, notes, attachments, value, owner, brand, and catalog classification

Verification:

- All views use the same filtered dataset.
- Stage transitions enforce domain rules.
- Optimistic movement rolls back on simulated failure.
- Audit history records stage changes.

### Task 3.7 — Implement Brands and Wiki

Routes:

```text
src/app/(crm)/brands/page.tsx
src/app/(crm)/brands/[brandId]/page.tsx
src/app/(crm)/wiki/page.tsx
```

Deliver:

- Searchable/sortable brand table
- Brand workspace with related records
- Wiki explorer and unified search
- Expandable brand/deal hierarchy

Verification:

- Brand aggregates match related deal data.
- Wiki search returns only permitted records.
- Selected items remain addressable through route/query state.

### Milestone 3 checkpoint

- Shared shell matches the screenshots.
- Dashboard, Chat, Leads, Deals, Brands, and Wiki are complete.
- The lead-to-deal workflow passes end-to-end tests.

## Milestone 4: Engagement Features

### Task 4.1 — Implement Inbox

Route: `src/app/(crm)/inbox/page.tsx`

Deliver:

- Channel tabs
- All/unread filter
- Search
- Conversation list and detail
- Compose dialog
- Simulated send behavior
- Demo Google connection banner

Verification:

- Messages persist locally in Neon.
- No outbound network call is made to a communication service.
- Sent messages create audit events.

### Task 4.2 — Implement Meetings

Route: `src/app/(crm)/meetings/page.tsx`

Deliver:

- Meetings/Recordings tabs
- Status filters and search
- Meeting detail, notes, transcript fixture, and recording fixture

Verification:

- Fixtures load through the mock calendar adapter.
- Pending, done, and failed states are demonstrable.

### Task 4.3 — Implement Proposals

Route: `src/app/(crm)/proposals/page.tsx`

Deliver:

- Presentation/Formal filters
- Lifecycle status filters
- Search
- Simulated upload metadata
- Preview
- Draft, sent, and signed transitions

Verification:

- No real upload is required.
- Proposal status transitions update related deal activity and audit logs.

### Task 4.4 — Implement Partnerships

Route: `src/app/(crm)/users/page.tsx`

Deliver:

- Account Manager permission-denied state
- Sales/Admin pending and approved views
- Partnership groups and membership management

Verification:

- Server-side role checks block Account Manager access.
- Group mutations create audit entries.

### Milestone 4 checkpoint

- All engagement routes work with simulated integrations.
- No external messages, invitations, uploads, or AI requests are possible.
- Role restrictions pass automated tests.

## Milestone 5: Business and System Features

### Task 5.1 — Implement Revenue

Route: `src/app/(crm)/revenue/page.tsx`

Deliver:

- Category filters
- KPI cards and target progress
- Project, startup MRR, and existing-client sections
- Monthly grids
- Add/edit revenue dialog

Verification:

- Totals are calculated server-side from fixture data.
- Won-deal revenue changes update Dashboard and Audit Logs.

### Task 5.2 — Implement Bills

Route: `src/app/(crm)/bills/page.tsx`

Deliver:

- Billing table
- Monthly and milestone configurations
- Billing periods and payment progress
- Create, edit, and soft-delete flows

Verification:

- Billing calculations pass unit tests.
- Deleted configurations are recoverable by reset.

### Task 5.3 — Implement Catalog

Route: `src/app/(crm)/catalog/page.tsx`

Deliver:

- Product, Service, and Reseller filters
- Sortable catalog table
- Preview, edit, active/inactive, and archive actions

Verification:

- Catalog classifications update relevant filters.
- Admin-only editing is enforced server-side.

### Task 5.4 — Implement Audit Logs

Routes:

```text
src/app/(crm)/audit-logs/page.tsx
src/app/(crm)/audit-logs/[logId]/page.tsx
```

Deliver:

- Search and entity/action/user filters
- Sorting and pagination
- Before/after change detail

Verification:

- Every approved mutation type appears correctly.
- Role-specific log visibility is enforced.
- Pagination performs efficiently with the seeded event volume.

### Task 5.5 — Implement Settings and Deal Trash

Routes:

```text
src/app/(crm)/settings/page.tsx
src/app/(crm)/settings/trash/page.tsx
```

Deliver:

- Persona profile
- Simulated integration statuses
- Deal Trash
- Restore flow
- Admin-only permanent-delete confirmation
- Protected demo-reset action

Verification:

- Integration controls never begin real OAuth.
- Restore returns the deal and its relationships.
- Permanent delete is unavailable outside Admin.
- Reset restores fixture counts and deterministic IDs.

### Milestone 5 checkpoint

- Revenue, Bills, Catalog, Audit Logs, Settings, and Deal Trash are complete.
- The full lead-to-revenue-to-audit workflow passes.
- Demo reset is reliable.

## Milestone 6: Verification and Deployment

### Task 6.1 — Automated quality gates

Required commands must cover:

- Lint
- Type check
- Unit tests
- Integration tests
- End-to-end tests
- Production build

Required end-to-end scenarios:

1. Persona switching and restricted navigation
2. Lead creation and conversion
3. Deal stage progression
4. Proposal lifecycle
5. Won deal to revenue and billing
6. Dashboard recalculation
7. Audit-log history
8. Archive, restore, and Admin permanent delete
9. Simulated message and meeting flows
10. Database reset

### Task 6.2 — Visual verification

- Use the audit screenshots as structural references.
- Capture the completed POC at the same desktop viewport.
- Compare navigation width, spacing, typography, table density, cards, borders, colors, empty states, and loading states.
- Correct material differences without importing protected assets or source code from the original site.

### Task 6.3 — Performance and free-tier checks

- Confirm key lists use pagination and indexed filters.
- Confirm dashboard aggregation queries are bounded.
- Avoid polling that prevents Neon scale-to-zero.
- Confirm no large binary data is stored in Neon.
- Confirm free-plan usage remains sufficient for presentation traffic.

### Task 6.4 — Production deployment

- Apply approved migrations to the production Neon branch/database.
- Seed the production demo dataset.
- Deploy the approved commit to Vercel Production.
- Run production smoke tests.
- Verify all integration actions remain mocked.
- Record the production URL and reset procedure in `README.md`.

### Milestone 6 checkpoint

- All automated checks pass.
- Visual review is accepted.
- Production runs on Vercel with the free Neon integration.
- The demo can be reset safely before every presentation.

## File and Module Map

```text
src/
├── app/
│   ├── (crm)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── chat/
│   │   ├── leads/
│   │   ├── deals/
│   │   ├── brands/
│   │   ├── wiki/
│   │   ├── inbox/
│   │   ├── meetings/
│   │   ├── proposals/
│   │   ├── users/
│   │   ├── revenue/
│   │   ├── bills/
│   │   ├── catalog/
│   │   ├── audit-logs/
│   │   └── settings/
│   └── api/
├── components/
│   ├── shell/
│   ├── shared/
│   ├── dashboard/
│   ├── crm/
│   ├── engagement/
│   ├── business/
│   └── system/
├── db/
│   ├── client.ts
│   ├── schema/
│   └── repositories/
├── integrations/
│   ├── contracts/
│   └── mock/
├── lib/
├── server/
│   ├── services/
│   └── validation/
└── styles/

scripts/
├── seed.ts
└── reset-demo.ts

tests/
├── unit/
├── integration/
├── e2e/
└── visual/
```

## Definition of Done

The implementation is complete only when:

- Every approved main page exists.
- Account Manager, Sales, and Admin personas behave correctly.
- The lead-to-revenue workflow succeeds end to end.
- All external integrations remain simulated.
- Every mutation is auditable.
- Seed and reset are deterministic.
- Lint, type checking, tests, and production build pass.
- Visual comparison against the captured pages is accepted.
- The application is deployed to Vercel and connected to a free Neon database.


