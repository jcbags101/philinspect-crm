# PhilInspect CRM MVP Completion Implementation Plan

Date: 2026-08-02  
Based on: `../specs/2026-08-02-philinspect-crm-mvp-design.md`  
Target application: `/Users/judebaguinang/code/personal-projects/crm-symph-poc`

## Outcome

Finish the existing PhilInspect CRM on the current `staging` branch and staging
infrastructure. The delivered application must implement all approved Figma
screens, working CRUD for contacts, companies, leads, deals, and tasks, a
persistent deal pipeline, functional inspection states, invitations, tenant-safe
RBAC, meaningful audit events, and complete automated/browser verification.

This plan does not create a per-customer GitHub repository, Neon project, or
Vercel project. It does not connect live messaging providers. It does not create
or modify a production deployment.

## Non-Negotiable Guardrails

- Preserve the current authenticated administrator identity and do not
  intentionally log it out during implementation or verification.
- Push application changes only to GitHub `staging`.
- Apply application migrations only to the PhilInspectCRM Neon `staging` branch.
- Use a separate Neon test branch/database for destructive integration tests.
- Do not print or commit database URLs, auth secrets, invitation tokens, or
  provider credentials.
- Do not use direct unscoped CRM queries from pages or Server Actions.
- Do not consider hidden UI controls sufficient authorization.
- Keep the unified inbox mock-backed and prevent live provider network calls.
- Render deferred modules as read-only `Coming soon` screens; do not expand their
  business scope.
- Before editing Next.js behavior, read the relevant local Next.js 16 guide in
  `node_modules/next/dist/docs/` as required by `AGENTS.md`.

## Delivery Order

1. Freeze the baseline and create a Figma route/state inventory.
2. Establish the isolated test database and integration-test harness.
3. Migrate identity, membership, invitation, and workspace scope.
4. Replace session fallback and centralize RBAC/error handling.
5. Introduce tenant-safe repositories, services, and audit transactions.
6. Implement Companies and Contacts.
7. Implement Leads and transactional conversion.
8. Implement Deals and pipeline movement.
9. Implement Tasks and the tenant-safe dashboard.
10. Implement Users/Invitations and Inspections.
11. Complete Inbox, Business/System, deferred, and responsive Figma screens.
12. Run the full security, behavior, visual, and staging release gates.

Every milestone ends with focused tests and a small commit. Do not begin a UI
milestone while its required schema/service milestone is failing.

## Milestone 0: Baseline and Figma Acceptance Matrix

### Task 0.1 — Record the implementation baseline

Inspect without changing external state:

- Git branch, commit, worktree, and remotes.
- Existing ready Vercel deployment and stable alias.
- Existing Neon project, staging branch, migration journal, and table counts.
- Current auth session behavior without signing out.
- Current lint, typecheck, unit-test, build, and Playwright status.

Update:

- `docs/operations/staging-cutover.md`

Record only safe identifiers, current commit/deployment references, schema
version, test results, rollback order, and known gaps. Never record secrets or
customer data.

Run:

```bash
npm run check
npm run test:e2e
```

Expected result: the pre-MVP baseline is reproducible and any existing failure is
recorded before feature work begins.

Commit:

```text
docs: record CRM MVP implementation baseline
```

### Task 0.2 — Build the authoritative Figma screen matrix

Use the read-only Figma file and the existing design contract. Revisit every
PhilInspect page/flow and capture exact frame names, route mapping, viewport,
modal/tab/state requirements, and implementation status.

Create:

- `docs/design-system/figma-screen-matrix.md`
- `tests/visual/README.md`

Update:

- `docs/design-system/figma-design-contract.md`

The matrix must cover:

- Overview
- Leads Flow
- Deals Flow
- Clients and Users
- Inbox Flow
- Business and System
- Inspections Flow
- Authentication/onboarding states used by the application

For each frame, record one of `missing`, `partial`, or `matched`, plus the target
route and test/screenshot name. Figma remains read-only.

Expected result: every Figma screen has a concrete route/state owner and no
screen can be omitted silently.

Commit:

```text
docs: map PhilInspect Figma screens to CRM routes
```

## Milestone 1: Test Database and Quality Harness

### Task 1.1 — Add an isolated integration-test database contract

Using the connected Neon tooling, create or confirm a persistent `test` child
branch from the same safe schema baseline as staging. Do not branch from or
modify the reserved production data state after application data is introduced.

Update:

- `.env.example`
- `README.md`
- `package.json`
- `vitest.config.ts`

Create:

- `vitest.integration.config.ts`
- `tests/integration/setup/database.ts`
- `tests/integration/setup/reset.ts`
- `tests/integration/database-smoke.test.ts`

Environment contract:

- `TEST_DATABASE_URL` is required only for integration tests.
- It must not equal the runtime `POSTGRES_URL` or migration target URL.
- The setup must fail safely before destructive cleanup if the database is not
  explicitly identified as a test target.

Scripts:

```json
{
  "test:unit": "vitest run --exclude tests/integration/**",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "test:all": "npm run test:unit && npm run test:integration"
}
```

Tests first:

- Refuse a missing `TEST_DATABASE_URL` with a variable-name-only error.
- Refuse a test URL that resolves to the staging runtime database.
- Apply migrations to an empty test database.
- Reset only application tables in the isolated test target.

Run:

```bash
npm run test:unit
npm run test:integration
```

Commit:

```text
test: add isolated Neon integration harness
```

### Task 1.2 — Add shared server result and test factories

Create:

- `src/server/errors/domain-error.ts`
- `src/server/errors/action-result.ts`
- `src/server/errors/translate-action-error.ts`
- `tests/factories/workspace.ts`
- `tests/factories/member.ts`
- `tests/factories/crm.ts`

Update:

- `src/app/inbox/actions.ts`

Define stable server outcomes for unauthenticated, forbidden, not found,
validation, conflict, and retryable errors. Error translation must log safe
diagnostics while returning non-sensitive user messages.

Tests first:

- Domain errors map to the correct public result.
- Unknown database/provider errors do not expose raw messages.
- The existing inbox action behavior remains compatible.

Run:

```bash
npm run test:unit
```

Commit:

```text
refactor: centralize safe server action results
```

## Milestone 2: Tenant Schema and Safe Migration

### Task 2.1 — Define memberships and invitations

Update:

- `src/db/schema/identity.ts`
- `src/db/schema/index.ts`
- `scripts/seed-data.ts`
- `scripts/seed.ts`

Add:

- `membership_status` enum
- `invitation_status` enum
- `workspace_memberships`
- `workspace_invitations`

Memberships contain workspace, user, role, status, creator, and timestamps.
Invitations contain workspace, normalized email, role, token hash, inviter,
expiry, status, accepted user, and timestamps. Store only a secure token hash;
the raw invitation token exists only in the generated acceptance URL.

Preserve `users.workspace_id` and `user_roles` temporarily for backfill and
compatibility. Do not drop them in the first migration.

Tests first:

- One active membership per workspace/user.
- Pending invitation uniqueness per workspace/email.
- The same identity can hold memberships in separate workspaces.
- Token hashes, not raw tokens, are persisted.

### Task 2.2 — Define the tenant-safe CRM schema

Update or split:

- `src/db/schema/crm.ts`
- `src/db/schema/business.ts`
- `src/db/schema/engagement.ts`
- `src/db/schema/system.ts`
- `src/db/schema/index.ts`

Create where useful:

- `src/db/schema/inspections.ts`

Schema work:

- Rename the user-facing/database Brand model to Company while preserving data.
- Add required `workspace_id` columns through a safe nullable/backfill sequence.
- Add `contacts`.
- Add company/contact references to leads.
- Add primary contact and workspace-scoped stage reference to deals.
- Add `pipeline_stages` with stable key, label, order, color role, outcome type,
  and active state.
- Add `tasks` with optional contact/company/lead/deal relationships.
- Add `inspections` and safe report metadata needed by the Figma screens.
- Add workspace scope to stage history, activities, notes, attachments,
  integrations, and any retained runtime legacy tables.
- Expand audit actions for invitations, membership/role changes, conversion,
  stage movement, completion, archive, and restore.
- Add composite indexes beginning with `workspace_id` for common list/filter and
  relationship lookups.
- Add workspace-relative uniqueness where required.

Every foreign record relationship must be enforceable in service tests. Use
composite database constraints where practical and service checks otherwise.

### Task 2.3 — Generate and inspect the migration

Run:

```bash
npm run db:generate
```

Inspect the generated `drizzle/0004_*.sql` and metadata for:

- accidental table/data drops;
- unsafe rename inference;
- non-null columns before backfill;
- global uniqueness that should be workspace-relative;
- foreign keys without safe delete behavior;
- missing tenant indexes;
- enum changes that cannot be rolled back;
- writes outside the application schema.

If Drizzle cannot safely infer the Brand-to-Company rename, edit the generated
migration deliberately and document the data-preserving rename/backfill.

Create:

- `scripts/verify-mvp-migration.ts`

The verifier checks pre/post row counts, workspace coverage, orphaned
relationships, company mapping, stage mapping, and initial-admin membership.

Apply and verify on the isolated test database first:

```bash
npm run test:integration
```

Then apply to Neon staging only after a rollback reference is recorded:

```bash
npm run db:migrate
npx tsx scripts/verify-mvp-migration.ts
```

Commit:

```text
feat: add tenant-safe CRM foundation
```

## Milestone 3: Session, Bootstrap, Invitations, and RBAC

### Task 3.1 — Replace fallback workspace bootstrap

Read the local Next.js 16 authentication, cookies, route-handler, and Server
Action documentation before editing.

Update:

- `src/server/auth/session-context.ts`
- `src/server/services/workspace-service.ts`
- `src/db/repositories/workspace-repository.ts`
- `src/app/api/session/bootstrap/route.ts`
- `src/components/auth/auth-form.tsx`
- `src/app/auth/sign-up/page.tsx`

Create:

- `src/server/validation/invitation.ts`
- `src/db/repositories/invitation-repository.ts`
- `src/server/services/invitation-service.ts`
- `src/app/auth/invite/[token]/page.tsx`
- `src/app/auth/access-denied/page.tsx`
- `src/app/auth/invite/[token]/actions.ts`

Behavior:

- Remove `demo:philinspect-staging` fallback.
- Migrate/preserve the existing approved account as initial admin.
- Require an active Neon Auth organization and active app membership.
- Permit sign-up/sign-in without granting CRM access.
- Accept a valid email-matched invitation idempotently.
- Support invitation expiry, revoke, resend/new-token, and safe retry.
- Keep the current session intact while testing admin behavior.

Tests first:

- Existing admin resolves after migration.
- Missing organization never falls into demo data.
- Uninvited user receives access denied.
- Valid invitation activates one membership.
- Email mismatch, expiry, revoke, and reuse are rejected safely.
- Concurrent acceptance creates no duplicate membership.

### Task 3.2 — Expand and enforce the permission model

Update:

- `src/server/auth/permissions.ts`
- `src/server/auth/permissions.test.ts`
- `src/server/auth/session-context.ts`

Create:

- `src/server/auth/authorize.ts`
- `src/server/auth/ownership.ts`
- `tests/integration/authorization.test.ts`

Add resource/action permissions for contacts, companies, leads, deals, tasks,
inspections, inbox, audit, members, invitations, and settings. Implement ownership
checks for Sales operations and workspace-wide permissions for Account Manager
and Admin according to the approved matrix.

Tests first:

- Every role/capability cell in the design matrix.
- UI-independent direct service denial.
- Assigned-versus-unassigned Sales behavior.
- Admin-only invitation, role, and settings behavior.
- Cross-tenant requests resolve as not found.

Commit:

```text
feat: enforce organization membership and CRM RBAC
```

## Milestone 4: Repository, Service, and Audit Foundation

### Task 4.1 — Add tenant-scoped repository contracts

Create:

- `src/db/repositories/contact-repository.ts`
- `src/db/repositories/company-repository.ts`
- `src/db/repositories/lead-repository.ts`
- `src/db/repositories/deal-repository.ts`
- `src/db/repositories/task-repository.ts`
- `src/db/repositories/inspection-repository.ts`
- `src/db/repositories/pipeline-repository.ts`
- `src/db/repositories/dashboard-repository.ts`
- `src/db/repositories/member-repository.ts`

Update:

- `src/db/repositories/audit-repository.ts`
- `src/db/repositories/inbox-repository.ts`

Every exported CRM repository method accepts `workspaceId`. Mutating methods
accept a transaction executor. Relationship queries include workspace scope on
both parent and child sides.

Create a source-level invariant test:

- `src/db/repositories/tenant-contract.test.ts`

It guards against exported tenant-entity lookup/mutation functions that omit a
workspace argument. This complements, but does not replace, integration tests.

### Task 4.2 — Generalize transactional audit recording

Update:

- `src/server/services/audit-service.ts`
- `src/db/repositories/audit-repository.ts`
- `src/db/schema/system.ts`

Create:

- `src/server/services/audit-service.test.ts`
- `tests/integration/audit.test.ts`

Implement a domain-neutral audit writer that accepts a database transaction,
session context, entity, action, label, and safe before/after state. Add recursive
redaction for password, token, cookie, secret, database URL, and provider
credential keys.

Tests first:

- Audit rows share the business transaction.
- Rollback removes both mutation and audit event.
- Sensitive keys are removed at every nesting level.
- Audit reads are workspace-scoped and permission-checked.

Commit:

```text
refactor: add tenant repositories and transactional audit service
```

## Milestone 5: Companies and Contacts

### Task 5.1 — Implement Company CRUD

Create:

- `src/server/validation/company.ts`
- `src/server/services/company-service.ts`
- `src/app/companies/page.tsx`
- `src/app/companies/loading.tsx`
- `src/app/companies/error.tsx`
- `src/app/companies/actions.ts`
- `src/app/companies/new/page.tsx`
- `src/app/companies/[companyId]/page.tsx`
- `src/app/companies/[companyId]/edit/page.tsx`
- `src/components/companies/company-table.tsx`
- `src/components/companies/company-form.tsx`
- `src/components/companies/company-detail.tsx`
- `tests/integration/companies-crud.test.ts`
- `tests/e2e/companies.spec.ts`

Implement create, list, detail, edit, archive, restore, search, filters, sorting,
pagination, relations, validation, permissions, and audit events. Add a permanent
redirect from `/brands` to `/companies` after migration verification.

Tests first, then implementation. Verify another workspace cannot list, read,
relate, update, archive, or restore the company.

### Task 5.2 — Implement Contact CRUD

Create:

- `src/server/validation/contact.ts`
- `src/server/services/contact-service.ts`
- `src/app/contacts/page.tsx`
- `src/app/contacts/loading.tsx`
- `src/app/contacts/error.tsx`
- `src/app/contacts/actions.ts`
- `src/app/contacts/new/page.tsx`
- `src/app/contacts/[contactId]/page.tsx`
- `src/app/contacts/[contactId]/edit/page.tsx`
- `src/components/contacts/contact-table.tsx`
- `src/components/contacts/contact-form.tsx`
- `src/components/contacts/contact-detail.tsx`
- `tests/integration/contacts-crud.test.ts`
- `tests/e2e/contacts.spec.ts`

Enforce same-workspace company and owner relationships. Normalize email and
phone values before uniqueness/duplicate checks.

Focused gate:

```bash
npm run test:unit
npm run test:integration
npx playwright test tests/e2e/companies.spec.ts tests/e2e/contacts.spec.ts
```

Commit:

```text
feat: add tenant-safe companies and contacts
```

## Milestone 6: Leads and Conversion

### Task 6.1 — Implement Lead CRUD and Figma flow

Create:

- `src/server/validation/lead.ts`
- `src/server/services/lead-service.ts`
- `src/app/leads/page.tsx`
- `src/app/leads/loading.tsx`
- `src/app/leads/error.tsx`
- `src/app/leads/actions.ts`
- `src/app/leads/new/page.tsx`
- `src/app/leads/[leadId]/page.tsx`
- `src/app/leads/[leadId]/edit/page.tsx`
- `src/components/leads/lead-table.tsx`
- `src/components/leads/lead-form.tsx`
- `src/components/leads/lead-detail.tsx`
- `src/components/leads/lead-status-control.tsx`
- `tests/integration/leads-crud.test.ts`
- `tests/e2e/leads.spec.ts`

Replace the generic `[feature]` Lead rendering with dedicated Figma-aligned
screens and server operations.

### Task 6.2 — Implement idempotent lead conversion

Create:

- `src/server/services/lead-conversion-service.ts`
- `src/components/leads/convert-lead-dialog.tsx`
- `tests/integration/lead-conversion.test.ts`

The conversion transaction creates or links a same-workspace contact and
company, creates the initial deal, writes initial stage history/activity/audit,
and marks the lead converted. A repeated request returns the existing conversion
or a safe conflict without duplicate records.

Tests first:

- New contact/company/deal conversion.
- Link-existing conversion.
- Duplicate retry/idempotency.
- Cross-tenant relationship rejection.
- Mid-transaction failure rollback.
- Permission denial without partial writes.

Commit:

```text
feat: implement leads and transactional conversion
```

## Milestone 7: Deals and Pipeline

### Task 7.1 — Implement Deal CRUD, list, and detail

Create:

- `src/server/validation/deal.ts`
- `src/server/services/deal-service.ts`
- `src/app/deals/page.tsx`
- `src/app/deals/loading.tsx`
- `src/app/deals/error.tsx`
- `src/app/deals/actions.ts`
- `src/app/deals/new/page.tsx`
- `src/app/deals/[dealId]/page.tsx`
- `src/app/deals/[dealId]/edit/page.tsx`
- `src/components/deals/deal-list.tsx`
- `src/components/deals/deal-form.tsx`
- `src/components/deals/deal-detail.tsx`
- `src/components/deals/deal-activity.tsx`
- `src/components/deals/deal-resources.tsx`
- `tests/integration/deals-crud.test.ts`
- `tests/e2e/deals.spec.ts`

Implement the Figma list/detail/activity/resources states with same-workspace
company, contact, owner, and stage validation.

### Task 7.2 — Implement persistent pipeline movement

Update or replace:

- `src/components/deal-board.tsx`

Create:

- `src/components/deals/pipeline-board.tsx`
- `src/components/deals/pipeline-column.tsx`
- `src/components/deals/pipeline-card.tsx`
- `src/components/deals/stage-select.tsx`
- `src/server/services/pipeline-service.ts`
- `src/server/services/pipeline-service.test.ts`
- `tests/integration/pipeline.test.ts`
- `tests/e2e/pipeline.spec.ts`

Implement pointer drag-and-drop plus an accessible stage select for keyboard and
mobile users. Use one transaction for deal update, stage history, activity, and
audit. Support optimistic UI only with rollback and a visible retryable error.

Tests first:

- Valid and invalid stage transitions.
- Assigned Sales movement versus forbidden unassigned movement.
- Cross-tenant stage and deal IDs.
- Exactly one history/activity/audit record per successful movement.
- No history or audit row on rollback.
- Keyboard and mobile stage changes.

Commit:

```text
feat: add deal CRUD and movable pipeline
```

## Milestone 8: Tasks and Dashboard

### Task 8.1 — Implement Task CRUD

Create:

- `src/server/validation/task.ts`
- `src/server/services/task-service.ts`
- `src/app/tasks/page.tsx`
- `src/app/tasks/loading.tsx`
- `src/app/tasks/error.tsx`
- `src/app/tasks/actions.ts`
- `src/app/tasks/new/page.tsx`
- `src/app/tasks/[taskId]/page.tsx`
- `src/app/tasks/[taskId]/edit/page.tsx`
- `src/components/tasks/task-table.tsx`
- `src/components/tasks/task-form.tsx`
- `src/components/tasks/task-status-control.tsx`
- `tests/integration/tasks-crud.test.ts`
- `tests/e2e/tasks.spec.ts`

Support create, list/detail, edit, assignment, complete, reopen, archive,
relations, filtering, sorting, pagination, permissions, and audit events.

Tests first: validate every optional relation belongs to the same workspace and
that Sales ownership rules apply.

### Task 8.2 — Rebuild the Overview from scoped services

Update:

- `src/app/page.tsx`
- `src/components/stat-card.tsx`

Create:

- `src/server/services/dashboard-service.ts`
- `src/components/dashboard/pipeline-summary.tsx`
- `src/components/dashboard/task-summary.tsx`
- `src/components/dashboard/recent-activity.tsx`
- `tests/integration/dashboard.test.ts`
- `tests/e2e/dashboard.spec.ts`

Remove every direct unscoped database query from the page. Render Figma-defined
metrics, pipeline, task, and activity states entirely from the active workspace.

Commit:

```text
feat: add tasks and tenant-safe overview
```

## Milestone 9: Users, Invitations, and Inspections

### Task 9.1 — Implement member and invitation management

Create:

- `src/app/users/page.tsx`
- `src/app/users/actions.ts`
- `src/app/users/loading.tsx`
- `src/app/users/error.tsx`
- `src/components/users/member-table.tsx`
- `src/components/users/invite-member-dialog.tsx`
- `src/components/users/role-control.tsx`
- `tests/integration/members-invitations.test.ts`
- `tests/e2e/invitations.spec.ts`

The admin can create a secure copyable invitation link, resend/rotate it, revoke
it, and change eligible member roles. Account Manager and Sales users cannot call
these actions. Role changes and invitation lifecycle actions are audited.

Do not add an external email provider for this MVP.

### Task 9.2 — Implement Figma inspection behavior

Create:

- `src/server/validation/inspection.ts`
- `src/server/services/inspection-service.ts`
- `src/app/inspections/page.tsx`
- `src/app/inspections/loading.tsx`
- `src/app/inspections/error.tsx`
- `src/app/inspections/actions.ts`
- `src/app/inspections/new/page.tsx`
- `src/app/inspections/[inspectionId]/page.tsx`
- `src/app/inspections/[inspectionId]/edit/page.tsx`
- `src/app/inspections/[inspectionId]/report/page.tsx`
- `src/components/inspections/inspection-table.tsx`
- `src/components/inspections/inspection-form.tsx`
- `src/components/inspections/inspection-detail.tsx`
- `src/components/inspections/report-viewer.tsx`
- `tests/integration/inspections.test.ts`
- `tests/e2e/inspections.spec.ts`

Implement the create/edit/assignment/status behavior shown in Figma. The report
viewer uses safe seeded metadata/content; advanced report generation remains
disabled and clearly labeled.

Commit:

```text
feat: add member invitations and inspections
```

## Milestone 10: Inbox, System, Deferred Screens, and Navigation

### Task 10.1 — Re-audit and harden the existing inbox

Update as required:

- `src/app/inbox/page.tsx`
- `src/app/inbox/actions.ts`
- `src/server/services/inbox-service.ts`
- `src/db/repositories/inbox-repository.ts`
- `src/components/inbox/*`
- `tests/e2e/inbox.spec.ts`

Close any remaining tenant gaps, validate assignees/tags/accounts in the same
workspace, use the shared action-result contract, and align the complete inbox
flow to Figma. Preserve deterministic send, reply, fail-once retry, duplicate
prevention, notes, status, unread, tags, and assignment tests.

Add a test that fails if the mock adapter attempts a real provider network call.

### Task 10.2 — Implement Audit Logs and Settings

Create:

- `src/app/audit-logs/page.tsx`
- `src/app/audit-logs/loading.tsx`
- `src/app/audit-logs/error.tsx`
- `src/components/audit/audit-table.tsx`
- `src/components/audit/audit-detail.tsx`
- `src/app/settings/page.tsx`
- `src/components/settings/workspace-settings.tsx`
- `tests/integration/audit-read.test.ts`
- `tests/e2e/audit-settings.spec.ts`

Implement Figma filters/detail states and permission rules. Admin can manage the
supported workspace settings; Account Manager has approved read-only audit
access; Sales receives a proper forbidden state.

### Task 10.3 — Replace generic POC routes and finish deferred screens

Update:

- `src/components/shell/navigation.ts`
- `src/components/shell/sidebar.tsx`
- `src/components/shell/header.tsx`
- `src/components/app-shell.tsx`
- `src/app/[feature]/page.tsx`

Create dedicated Figma-aligned read-only routes/components as required by the
screen matrix for:

- revenue and billing
- AI
- custom domains
- marketplace
- advanced reports
- documents
- custom fields

Create a reusable component:

- `src/components/deferred/coming-soon-panel.tsx`

Remove unsupported POC items from primary navigation and add safe redirects for
renamed routes. Do not leave executable direct database reads in the generic
`[feature]` route.

Commit:

```text
feat: complete inbox and system Figma flows
```

## Milestone 11: Design-System and Responsive Figma Completion

### Task 11.1 — Complete reusable component variants

Update:

- `src/styles/tokens.css`
- `src/styles/typography.css`
- `src/styles/utilities.css`
- `src/app/globals.css`
- `src/components/ui/*`
- `src/components/molecules/*`
- `src/components/design-system/design-system-gallery.tsx`
- `src/app/design-system/page.tsx`

Create only components demanded by the Figma screen matrix, such as form-field,
combobox, date control, toast, banner, drawer, and board primitives when absent.

Rules:

- Use semantic design tokens.
- Preserve Figma compact typography and 8px layout rhythm.
- Implement hover, focus, pressed, selected, disabled, loading, invalid, and
  destructive states.
- Give icon-only controls accessible names.
- Do not encode status only by color.
- Respect reduced motion.

### Task 11.2 — Add visual route coverage

Create:

- `tests/e2e/figma-screens.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `tests/visual/` screenshot baselines or approved comparison artifacts

Update:

- `playwright.config.ts`
- `docs/design-system/figma-screen-matrix.md`

Cover every matrix row and the applicable viewport set:

- `1440x1000`
- `1024x768`
- `768x1024`
- `390x844`
- `360x800`

Use stable seeded data, mask only genuinely nondeterministic content, and do not
approve screenshots with missing data, console errors, clipped actions, or
incorrect empty/error states.

Commit:

```text
test: verify all PhilInspect Figma screens
```

## Milestone 12: Full Security and Behavior Acceptance

### Task 12.1 — Complete tenant-isolation coverage

Create or complete:

- `tests/integration/tenant-isolation.test.ts`
- `tests/integration/relationship-isolation.test.ts`
- `tests/integration/destructive-isolation.test.ts`

For every organization-owned resource, prove:

- tenant A cannot list tenant B rows;
- tenant A cannot read a known tenant B ID;
- tenant A cannot update/archive/restore/delete a known tenant B ID;
- tenant A cannot assign or relate a tenant B record;
- cross-tenant behavior returns not found rather than existence details;
- audit events cannot be read or written across tenants.

### Task 12.2 — Add the complete MVP Playwright story

Create:

- `tests/e2e/mvp-flow.spec.ts`
- `tests/e2e/restricted-user.spec.ts`
- `tests/e2e/retry-safety.spec.ts`

Verify this exact story with dedicated test identities:

1. Admin signs in.
2. Admin creates a company.
3. Admin creates its contact.
4. Admin creates and converts a lead.
5. Admin creates/completes a related task.
6. Admin moves the resulting deal.
7. Admin creates an inspection and changes its status.
8. Admin verifies activity and audit events.
9. Admin creates a Sales invitation link.
10. The invited Sales user signs up/signs in and accepts it.
11. The Sales user completes an allowed assigned action.
12. Direct forbidden operations for users, settings, audit, other-owner records,
    archive, and cross-tenant IDs fail safely.
13. A simulated transient failure retries without duplicate records or audit
    events.

The test must not sign out the user's existing browser/session profile; use an
isolated Playwright context and disposable test identities.

### Task 12.3 — Run the complete local quality gate

Fix root causes rather than suppressing checks.

Run:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npm run test:e2e
```

Inspect:

- server/browser console output;
- failed network requests;
- missing accessible labels;
- hydration errors;
- tenant scope in generated SQL/log-safe diagnostics;
- migration verification output;
- Figma screen matrix with no `missing` or `partial` rows.

Commit:

```text
test: complete PhilInspect CRM MVP acceptance coverage
```

## Milestone 13: Staging Migration, Deployment, and Live Verification

### Task 13.1 — Pre-deployment safety gate

Before pushing:

- Confirm the worktree contains only reviewed MVP changes.
- Confirm the branch is `staging`.
- Confirm the Neon target is the staging branch, not primary.
- Confirm a separate test branch was used for destructive tests.
- Record the prior ready Vercel deployment and database rollback reference.
- Confirm required staging environment variables exist without printing values.
- Confirm no live messaging-provider secrets or endpoints were added.

Update:

- `docs/operations/staging-cutover.md`

### Task 13.2 — Apply the reviewed staging migration

Apply the exact migration already proven against empty and legacy-shaped test
databases:

```bash
npm run db:migrate
npx tsx scripts/verify-mvp-migration.ts
```

Verify:

- existing admin membership;
- non-null workspace coverage;
- Brand-to-Company preservation;
- stage mapping;
- no orphans;
- expected seed counts;
- reserved production branch unchanged.

Stop before deployment if migration verification fails. Do not continue past the
first broken boundary.

### Task 13.3 — Push staging and verify the Vercel deployment

Push only the reviewed `staging` commits. Let the configured Git integration
produce the deployment. Inspect its build state and logs; do not create a
production project or change the production branch mapping.

Run the deployed suite using the stable or candidate staging URL:

```bash
PLAYWRIGHT_BASE_URL=<staging-url> npm run test:e2e
```

Follow the complete story across browser, Server Actions/routes, Neon data, and
rendered response. Stop at the first broken boundary, fix it on `staging`, rerun
the focused flow, and then rerun the entire acceptance suite.

### Task 13.4 — Final requirement-by-requirement audit

Create:

- `docs/operations/mvp-verification.md`

For every acceptance criterion in the design spec, record current evidence:

- implementation file/route;
- automated test name and result;
- screenshot/matrix result;
- migration verifier evidence;
- deployed flow evidence;
- explicit status: proven or not proven.

Do not call the CRM an MVP while any row is missing, partial, failing, or
supported only by indirect evidence.

Final commit:

```text
docs: record PhilInspect CRM MVP verification
```

## Completion Gate

The implementation is complete only when:

- all design-spec acceptance criteria are proven;
- every Figma matrix row is `matched`;
- all required CRUD and inspection actions work;
- the deal pipeline persists stage movement;
- invitation/bootstrap/RBAC behavior works for admin and restricted users;
- tenant-isolation tests cover every server resource and action class;
- meaningful audit records are transactional and safely scoped;
- the existing mock inbox still passes;
- deferred screens cannot perform unsupported mutations;
- lint, typecheck, unit, integration, build, local Playwright, and deployed
  Playwright checks all pass;
- the existing staging URL serves the verified build;
- the current administrator account remains usable;
- no production or live-provider scope was introduced.
