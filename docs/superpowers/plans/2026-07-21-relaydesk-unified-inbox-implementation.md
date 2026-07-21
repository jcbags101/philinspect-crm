# RelayDesk Unified Inbox and Staging Foundation Implementation Plan

Date: 2026-07-21  
Based on: `../specs/2026-07-21-relaydesk-unified-inbox-design.md`  
Target application: `/Users/judebaguinang/code/personal-projects/crm-symph-poc`

## Outcome

Deliver a staging-only CRM deployment backed by the `PhilInspectCRM` Neon project and Neon Auth, with a persistent Pancake-style Messenger and Instagram mock inbox. The current Vercel project becomes the stable staging application and tracks only the GitHub `staging` branch.

No step may connect a real messaging account, call a messaging provider, modify the Neon primary branch, create a production Vercel project, or push application changes to GitHub `main`.

## Delivery Order

1. Preserve and document the current state.
2. Establish the Neon staging foundation.
3. Add Neon Auth and workspace authorization.
4. Add the inbox schema, migrations, and deterministic fixtures.
5. Add repositories, services, and the mock adapter.
6. Build the dedicated inbox interface and mutations.
7. Add automated and browser verification.
8. Create the GitHub staging flow and cut the current Vercel project over to staging.

Each checkpoint must pass before beginning the next milestone.

## Milestone 1: State and Safety Baseline

### Task 1.1 — Record the rollback baseline

Inspect without modifying:

- current Git branch, worktree, and commit;
- current Vercel project id and ready deployment;
- current local Neon project id and host;
- `PhilInspectCRM` project, primary branch, tables, and Neon Auth schema;
- tracked and ignored environment files.

Create:

- `docs/operations/staging-cutover.md`

Document safe identifiers, verification commands, rollback order, and the rule that the older Neon project is retained. Do not record credentials, tokens, connection strings, or message bodies.

Verification:

- Worktree contains only planned changes.
- Existing local checks pass before dependency or schema changes.
- The current ready Vercel deployment remains available.

Commit:

```text
Document staging cutover baseline
```

### Task 1.2 — Normalize environment contracts

Update:

- `.env.example`
- `README.md`
- `src/db/client.ts`
- `drizzle.config.ts`

Required server variables:

- `POSTGRES_URL` for pooled runtime access;
- `DATABASE_URL_UNPOOLED` for Drizzle migrations;
- `NEON_PROJECT_ID`;
- `NEON_AUTH_BASE_URL`;
- `NEON_AUTH_COOKIE_SECRET` with at least 32 characters.

Rules:

- Remove duplicate template keys.
- Keep all values empty in tracked templates.
- Reject missing values with safe variable-name-only errors.
- Do not expose secrets through `NEXT_PUBLIC_` variables.
- Continue accepting `DATABASE_URL` only as a temporary compatibility fallback in the database client.

Verification:

- `git grep` finds no connection string or credential.
- Lint and type checking pass.

## Milestone 2: PhilInspectCRM Staging Branch

### Task 2.1 — Create the isolated Neon branch

Using the connected Neon project tooling:

- confirm `PhilInspectCRM` project id;
- confirm the primary branch is unchanged and contains only the existing Neon Auth foundation;
- create a persistent child branch named `staging` from the primary branch;
- describe the new branch and record only its safe branch id in the cutover document;
- obtain pooled and direct connection values without printing or committing them;
- confirm the staging branch has its own Neon Auth endpoint.

The primary branch must not receive migrations or seed data.

Verification:

- `staging` and the primary branch both report ready.
- Auth tables exist on `staging`.
- CRM application tables do not yet exist on the primary branch.

### Task 2.2 — Point local development at staging safely

Update ignored local environment files so the single-developer POC points to the Neon `staging` branch. Preserve the previous ignored file outside Git for rollback.

Never print values. Verify only:

- project id;
- branch id;
- redacted hostname;
- presence and minimum length of the auth cookie secret.

Run:

```bash
npm run db:migrate
npm run db:seed
```

Verification:

- Existing migration applies successfully to `staging`.
- Seed counts match the deterministic fixture contract.
- The Neon primary branch remains without CRM tables.
- The application renders locally from `staging`.

## Milestone 3: Neon Auth and Workspace Authorization

### Task 3.1 — Install and configure Neon Auth

Add dependency:

- `@neondatabase/auth`

Create:

```text
src/lib/auth/server.ts
src/lib/auth/client.ts
src/app/api/auth/[...path]/route.ts
src/app/auth/sign-in/page.tsx
src/app/auth/sign-up/page.tsx
src/components/auth/auth-form.tsx
src/proxy.ts
```

Use the current `createNeonAuth()` Next.js server API with explicit `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`. Protect CRM routes and redirect unauthenticated requests to sign-in. Server components using sessions must be dynamic.

Implement email/password sign-up, sign-in, and sign-out. Do not add social OAuth.

Verification:

- A staging user can sign up, sign in, refresh, and sign out locally.
- Session cookies are HTTP-only, signed, and environment-specific.
- An unauthenticated `/inbox` request redirects to sign-in.

### Task 3.2 — Add workspace and identity mapping

Update:

- `src/db/schema/identity.ts`
- `src/db/schema/system.ts`
- `src/db/schema/index.ts`

Create:

```text
src/db/repositories/workspace-repository.ts
src/server/services/workspace-service.ts
src/server/auth/session-context.ts
src/server/auth/permissions.ts
```

Schema changes:

- `workspaces` with a unique Neon Auth organization id and display name;
- `users.auth_user_id` with a unique external identity reference;
- `users.workspace_id`;
- `audit_logs.workspace_id`.

On first authenticated access, create or resolve the application user and default workspace. Assign the first workspace member the Admin role. Later users receive the least-privileged configured role.

The client persona selector must not alter the server session or permissions.

Tests:

- first-user bootstrap;
- existing-user resolution;
- cross-workspace denial;
- Admin, Account Manager, and Sales permission checks.

Commit:

```text
Add Neon Auth workspace foundation
```

## Milestone 4: Inbox Data Foundation

### Task 4.1 — Define the inbox schema

Create:

- `src/db/schema/inbox.ts`

Update:

- `src/db/schema/engagement.ts`
- `src/db/schema/index.ts`
- `src/db/schema/system.ts`

Add or extend:

- messaging accounts;
- workspace-scoped conversations;
- message delivery state and idempotency fields;
- message attempts;
- conversation tags and join table;
- assignments, unread count, and conversation status;
- internal notes represented as internal-direction messages;
- workspace-scoped audit actions for inbox mutations.

Add useful unique constraints and indexes for:

- workspace plus fictional external account id;
- workspace plus fictional provider conversation id;
- conversation plus idempotency key;
- account plus last-message timestamp;
- workspace, status, assignee, and unread filtering;
- message chronology.

Money, CRM, and unrelated tables remain unchanged.

### Task 4.2 — Generate and inspect the migration

Run:

```bash
npm run db:generate
```

Inspect generated SQL for:

- accidental drops;
- missing foreign keys;
- missing indexes;
- incorrect nullability;
- unsafe enum changes;
- writes outside the application schema.

Apply only to Neon `staging`:

```bash
npm run db:migrate
```

Verification:

- Migration applies to an empty test database and the populated staging database.
- Primary Neon schema remains unchanged.
- Drizzle type checking passes.

### Task 4.3 — Expand deterministic fixtures

Update:

- `scripts/seed-data.ts`
- `scripts/seed.ts`
- `scripts/reset-demo.ts`

Seed:

- two Messenger accounts;
- two Instagram accounts;
- at least 24 conversations distributed across accounts;
- at least 160 chronological messages;
- open, pending, and resolved conversations;
- unread and assigned/unassigned examples;
- reusable workspace tags;
- deterministic delivery, failure-once, retry, and auto-reply fixture scenarios;
- safe inbox audit events.

Reset deletes and reseeds only the application demo workspace. It must not delete or rewrite Neon Auth schemas or the Neon primary branch.

Verification:

- Two reset runs produce identical fixture identifiers and counts.
- No real person, Page, Instagram handle, or confidential source record appears.

Commit:

```text
Add workspace-scoped inbox schema and fixtures
```

## Milestone 5: Repositories, Services, and Mock Adapter

### Task 5.1 — Build repository boundaries

Create:

```text
src/db/repositories/inbox-repository.ts
src/db/repositories/audit-repository.ts
src/server/validation/inbox.ts
```

Repository queries always require a workspace id. Implement:

- account summaries;
- paginated conversation search and filtering;
- thread loading;
- idempotent message insert;
- delivery-state updates and attempts;
- assignment, status, unread, tag, and note writes;
- audit writes in the caller's transaction.

No page or client component may import Drizzle or schema tables.

### Task 5.2 — Implement the adapter contract

Create:

```text
src/integrations/messaging/types.ts
src/integrations/messaging/mock-messaging-adapter.ts
src/integrations/messaging/index.ts
```

The contract exposes account health, synchronization, send, and retry outcomes. The mock adapter reads only bounded fixture configuration and never performs `fetch`, opens sockets, or imports a Meta SDK.

Deterministic scenarios:

- success through sent, delivered, and read;
- sent and delivered without read;
- fail once and succeed on retry;
- deterministic inbound response after delivery;
- simulated account synchronization warning.

Tests assert identical input produces identical output.

### Task 5.3 — Implement inbox services

Create:

```text
src/server/services/audit-service.ts
src/server/services/inbox-service.ts
src/server/services/demo-reset-service.ts
```

Implement:

- account and conversation reads;
- send and retry transactions;
- assignment, status, unread, tag, and note mutations;
- permission checks;
- safe audit records;
- explicit demo reset.

Sending flow:

1. Validate the session, workspace, role, conversation, and body.
2. Insert a queued message and audit event transactionally.
3. Invoke the mock adapter with the persisted id.
4. Persist delivery attempts and final state.
5. Persist an optional deterministic inbound response.
6. Return the canonical thread state.

Tests cover idempotency, rollback, retry, cross-workspace denial, and audit writes.

Commit:

```text
Add mock messaging domain services
```

## Milestone 6: Dedicated Inbox Interface

### Task 6.1 — Create the dedicated route and server actions

Create:

```text
src/app/inbox/page.tsx
src/app/inbox/loading.tsx
src/app/inbox/error.tsx
src/app/inbox/actions.ts
```

Update:

- `src/app/[feature]/page.tsx` to remove the generic inbox implementation;
- `src/components/app-shell.tsx` only if routing or the Demo indicator requires it.

Server actions call the inbox service and return typed success or safe error results. They revalidate only affected inbox data.

### Task 6.2 — Build the responsive workspace

Create:

```text
src/components/inbox/inbox-workspace.tsx
src/components/inbox/account-filters.tsx
src/components/inbox/conversation-list.tsx
src/components/inbox/conversation-row.tsx
src/components/inbox/message-thread.tsx
src/components/inbox/message-bubble.tsx
src/components/inbox/message-composer.tsx
src/components/inbox/conversation-toolbar.tsx
src/components/inbox/customer-context.tsx
src/components/inbox/inbox-empty-state.tsx
src/components/inbox/inbox-skeleton.tsx
```

Desktop uses the approved three-column layout. Mobile switches between list and thread without losing filters. Preserve the existing dark CRM visual language and accessible keyboard focus.

Requirements:

- persistent `Demo — no external message sent` indicator;
- Messenger and Instagram account/channel filters;
- search, unread, assignment, and tag filters;
- chronological thread with delivery state;
- text composition and bounded simulated attachments;
- assignment, status, unread, tags, and internal notes;
- related brand and lead context;
- loading, empty, permission, and failure states;
- no iframe or external messaging URL.

### Task 6.3 — Verify interactive behavior locally

Check:

- send survives refresh;
- deterministic response appears once;
- failure retry does not duplicate content;
- assignment, tags, notes, and unread changes persist;
- search and account filters can combine;
- mobile back navigation preserves state;
- persona visuals cannot bypass permission checks.

Commit:

```text
Build the RelayDesk mock unified inbox
```

## Milestone 7: Automated Verification

### Task 7.1 — Expand unit and integration tests

Create:

```text
src/integrations/messaging/mock-messaging-adapter.test.ts
src/server/services/inbox-service.test.ts
src/server/auth/permissions.test.ts
tests/integration/inbox-repository.test.ts
tests/integration/inbox-mutations.test.ts
```

Integration tests use an isolated database target and never the Neon primary branch.

### Task 7.2 — Add Playwright smoke tests

Add dependency:

- `@playwright/test`

Create:

```text
playwright.config.ts
tests/e2e/auth.spec.ts
tests/e2e/inbox.spec.ts
```

Add package scripts for browser tests and install only the Chromium runtime needed by CI.

Cover:

- sign-up/sign-in/sign-out;
- protected route redirect;
- account and channel filtering;
- conversation search and selection;
- mock send and refresh persistence;
- fail-once retry;
- assignment, tags, note, and unread mutations;
- mobile list/thread navigation;
- Demo indicator visibility.

### Task 7.3 — Run the complete local gate

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright test
```

Also inspect browser console errors and confirm no request targets a real messaging provider.

Commit:

```text
Verify RelayDesk inbox workflows
```

## Milestone 8: GitHub and Vercel Staging Cutover

### Task 8.1 — Create the GitHub staging repository

Create a private, empty GitHub repository named `philinspect-crm`. Do not initialize it with a README, license, or `.gitignore`.

Locally:

- create or rename the active shared branch to `staging` at the verified implementation commit;
- add the GitHub remote;
- push only `staging`;
- set `staging` as the GitHub default branch;
- enable branch protection if available without a paid upgrade;
- confirm no secret or ignored environment file is present remotely.

Do not push `main`.

### Task 8.2 — Connect the current Vercel project to GitHub staging

For the existing Vercel project `crm-symph-poc`:

- connect the `philinspect-crm` GitHub repository;
- set the Vercel Production Branch to `staging`;
- keep the existing project and domains;
- do not create a new Vercel project;
- do not create a Vercel custom environment or paid resource.

The current Vercel project's stable Production target is operationally staging.

### Task 8.3 — Replace Vercel database and auth variables

Update the current Vercel project's Production variables with only the Neon `staging` branch values:

- pooled runtime URL;
- direct migration URL where required;
- Neon project id;
- staging Neon Auth base URL;
- a staging auth cookie secret.

Remove or override the older Neon values only after capturing safe rollback metadata. Never display secret values.

Development and generic Preview variables remain non-production and must not point to the Neon primary branch.

### Task 8.4 — Deploy and verify staging

Push the verified commit to GitHub `staging` and allow the Git integration to create the stable Vercel deployment.

Verify:

- deployment commit matches GitHub `staging`;
- build is READY;
- staging database host resolves to the PhilInspectCRM staging branch;
- sign-up/sign-in work through staging Neon Auth;
- seeded inbox renders;
- the full browser smoke suite passes against the staging URL;
- no Production Neon schema or separate production Vercel project was created;
- prior Vercel deployment remains available for rollback.

Update:

- `README.md` with the staging URL and workflow;
- `docs/operations/staging-cutover.md` with final safe identifiers and verification results.

Commit and push:

```text
Document the PhilInspectCRM staging deployment
```

## Final Definition of Done

- `PhilInspectCRM/staging` is the only CRM database used locally and by the current Vercel staging project.
- Neon Auth protects the CRM and maps users to workspace-scoped application roles.
- The mock unified inbox supports multiple Messenger and Instagram accounts, persistent threads, delivery states, assignment, tags, notes, unread state, search, and retry.
- No external messaging API or real account is contacted.
- GitHub `staging` is the only deployed source branch.
- The current Vercel project tracks GitHub `staging` and has a stable staging URL.
- GitHub `main`, Neon primary, and any future production Vercel project remain untouched.
- Lint, type checking, unit tests, integration tests, build, and Playwright tests pass.
- The old Neon project remains intact until a separate cleanup approval.
