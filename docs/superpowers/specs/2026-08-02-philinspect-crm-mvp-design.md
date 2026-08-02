# PhilInspect CRM MVP Completion Design

Date: 2026-08-02
Status: Approved
Target: Existing PhilInspect CRM staging application

## 1. Purpose

Finish the existing PhilInspect CRM as a usable MVP without creating a CRM
provisioning platform or a second customer deployment. The finished staging
application must implement every PhilInspect product screen represented in the
approved Figma file, provide functional core CRM workflows, enforce tenant and
role boundaries on the server, and be covered by meaningful automated tests.

The existing GitHub repository, Neon staging branch, Neon Auth configuration,
Vercel staging project, and currently authenticated administrator account remain
in place.

## 2. Source of Truth

- Figma file: `Philinspect CRM`
- Figma file key: `PZQZcN7DmZT8oZ8KyXOWVr`
- Design contract: `docs/design-system/figma-design-contract.md`
- Application stack: Next.js 16, React 19, Drizzle ORM, Neon Postgres,
  Neon Auth, Tailwind CSS 4, Base UI, and Vercel
- Deployment branch: `staging`
- Database target: the existing PhilInspectCRM Neon `staging` branch
- Hosting target: the existing CRM Vercel staging project

Figma is read-only. The implementation must follow the named foundations,
components, templates, and PhilInspect product pages in that file. Component
definitions and named design variables take precedence over page-local visual
approximations.

## 3. Scope

### 3.1 Required MVP capabilities

- Authentication with Neon Auth.
- Organization bootstrap with no demo-organization fallback.
- Preservation of the currently authenticated account as the initial admin.
- Admin-managed organization invitations and invitation acceptance.
- Functional CRUD for contacts, companies, leads, deals, and tasks.
- Functional inspection list/detail management and status changes for the actions
  represented in Figma.
- Transactional lead conversion into a contact, company, and initial deal.
- A usable deal pipeline with board and list views and persistent stage movement.
- Central RBAC enforced on every server read and mutation.
- Workspace filtering on every organization-owned table and repository operation.
- Meaningful audit events for important user and system actions.
- Functional existing mock unified inbox, still explicitly labeled as simulated.
- Every PhilInspect Figma product screen, modal, tab, and important state.
- Authorization, tenant-isolation, CRUD, bootstrap/invitation, pipeline, audit,
  migration, and end-to-end tests.
- Verified staging deployment through the existing GitHub, Neon, and Vercel
  resources.

### 3.2 Deferred capabilities

The following may be represented as visually complete, read-only Figma screens
with disabled actions and a clear `Coming soon` state, but their business
workflows are not part of this MVP:

- Billing and revenue mutations
- AI features
- Custom domains
- Marketplace
- Advanced reports
- Documents
- Custom fields
- Live Messenger, Instagram, Viber, or other messaging-provider integrations

### 3.3 Explicitly removed scope

The MVP will not implement an application provisioner that creates a GitHub
repository, Neon project, or Vercel project for each customer. It will continue
and finish the CRM that already exists.

## 4. Architecture

The repository remains one deployable Next.js application. Feature code is
organized around domain boundaries rather than generic catch-all pages.

The required server flow is:

```text
Figma-aligned page/component
  -> validated Server Action or route handler
  -> permission-aware domain service
  -> workspace-scoped repository
  -> Drizzle transaction/query
  -> Neon Postgres
```

The application is divided into the following modules:

1. Identity and access: sessions, workspaces, memberships, invitations, roles,
   and permissions.
2. Core CRM: contacts, companies, leads, deals, tasks, pipeline stages,
   activities, notes, and stage history.
3. Operations: dashboard, inbox, audit logs, settings, and user management.
4. Inspections: the inspection list, detail, status, and report-viewing states
   shown in Figma.
5. Presentation: design tokens, reusable UI components, responsive layouts,
   empty/loading/error states, and deferred-module states.

Pages must not query organization-owned CRM tables directly. Reads and writes
must pass through a service/repository boundary that makes authentication,
authorization, and workspace scope explicit.

## 5. Authentication and Organization Bootstrap

### 5.1 Existing administrator

The current account and Neon Auth identity must be preserved. During migration,
that account is linked to the PhilInspect workspace with the `admin` role. No
implementation or verification step may intentionally log out this account.

### 5.2 Session resolution

An authenticated session is usable only when all of the following are true:

- Neon Auth returns a valid user.
- The session has an active organization.
- The organization maps to an application workspace.
- The user has an active membership in that workspace.

The current `demo:philinspect-staging` fallback is removed. Missing organization
or membership state produces an explicit onboarding or access-denied result.

### 5.3 Invitations

- Only an admin may invite a member.
- Invitations are scoped to one workspace and one normalized email address.
- An invitation records the intended role, inviter, expiry, status, and safe
  acceptance metadata.
- Acceptance requires the authenticated email to match the invitation email.
- Acceptance is idempotent and creates or activates exactly one membership.
- Expired, revoked, already accepted, and mismatched invitations produce distinct
  safe errors.
- Invitation creation, resend, revoke, acceptance, and role changes are audited.
- Open sign-up alone never grants access to an existing CRM workspace.

## 6. Tenancy Model

### 6.1 Identity tables

- `users` represents authenticated identities and profile information.
- `workspaces` maps an application tenant to its Neon Auth organization.
- `workspace_memberships` links users to workspaces with role and membership
  status.
- `workspace_invitations` records pending and completed invitations.

The membership model replaces the assumption that a user row can belong to only
one workspace. The application may initially expose only one active workspace,
but the database and service boundaries must remain correct for multiple tenants.

### 6.2 Organization-owned data

Every organization-owned table has a required `workspace_id`, including:

- contacts
- companies
- leads
- deals
- tasks
- pipeline stages
- deal stage history
- activities
- notes
- attachments
- inspections and inspection report metadata
- existing inbox accounts, conversations, messages, tags, and notes
- integrations
- audit logs

Any retained legacy meeting, proposal, partnership, catalog, revenue, or billing
table also receives workspace scope before it can be read by a runtime route.
Otherwise, its old route is removed and the deferred Figma state uses safe static
presentation data rather than an unscoped query.

Relationships must be validated within the same workspace. An owner, assignee,
company, contact, lead, deal, pipeline stage, or related record from another
workspace is rejected even if its identifier is valid.

### 6.3 Repository invariant

All organization-owned repository methods require `workspaceId`. Lookup,
update, archive, restore, and delete predicates include both the record ID and
the workspace ID. There is no application-level unscoped `findById`, `updateById`,
or `deleteById` method for tenant data.

Cross-tenant identifiers return the same not-found result as nonexistent
identifiers to avoid disclosing record existence.

## 7. Roles and Permissions

The MVP retains three user-facing roles and replaces inbox-only permissions with
a centralized resource/action permission map.

| Capability | Sales | Account Manager | Admin |
| --- | --- | --- | --- |
| View core CRM records | Yes | Yes | Yes |
| Create core CRM records | Assigned workflow | Yes | Yes |
| Update owned/assigned records | Yes | Yes | Yes |
| Update any core CRM record | No | Yes | Yes |
| Move assigned deals | Yes | Yes | Yes |
| Archive or restore records | No | Yes | Yes |
| Permanently delete protected data | No | No | Admin-only where supported |
| View/send mock inbox messages | Yes | Yes | Yes |
| Triage/assign inbox conversations | No | Yes | Yes |
| View audit logs | No | Read | Yes |
| Invite users or change roles | No | No | Yes |
| Manage workspace settings | No | No | Yes |

UI affordances reflect permissions, but server services remain authoritative.
Tests must call server operations directly to prove that hidden controls are not
the only protection.

## 8. Core CRM Data and Behavior

### 8.1 Contacts

Contacts include name, job title, email, phone, lifecycle status, company,
owner, timestamps, and archive state. The UI supports list/detail/create/edit,
search, filters, sorting, pagination, and related CRM activity.

### 8.2 Companies

Companies replace the user-facing `Brands` concept. They include name, domain,
industry, address, owner, timestamps, and archive state. Company detail shows
its contacts, leads, deals, tasks, and activity.

Existing Brand records are migrated without silently losing relationships.
Compatibility aliases may exist during migration, but new domain code and UI use
`Company` terminology.

### 8.3 Leads

Leads include contact/company information, source, segment, qualification status,
owner, notes, timestamps, conversion metadata, and archive state. The lead flow
supports creation, editing, assignment, qualification, archiving, and conversion.

Lead conversion is one transaction:

1. Create or link the contact.
2. Create or link the company.
3. Create the initial deal.
4. Mark the lead converted.
5. Create activity, stage-history, and audit entries.
6. Roll back every change if one step fails.

Repeated conversion attempts return the previously created result or a safe
conflict; they never duplicate contacts, companies, or deals.

### 8.4 Deals and pipeline

Deals include company, primary contact, owner, value, currency, probability,
expected close date, stage, timestamps, and archive state.

The pipeline supports:

- Figma-matching board and list views.
- Persistent drag-and-drop stage movement.
- A keyboard- and mobile-accessible stage selector.
- Workspace-scoped pipeline stages seeded in the Figma order.
- Valid transition checks.
- Optimistic UI with rollback when persistence fails.
- Stage history, activity, and audit writes in the same transaction.
- Won and lost outcomes.
- Archive and restore where represented by the approved UI.

### 8.5 Tasks

Tasks include title, description, priority, status, due date, owner, timestamps,
and optional contact/company/lead/deal relationships. They support list/detail,
create/edit, assignment, completion, reopening, filters, sorting, pagination,
and archive behavior.

A task relationship is valid only when every linked record belongs to the same
workspace.

## 9. Audit Events

Meaningful events include:

- record creation and material field changes
- ownership or assignment changes
- lead status and lead conversion
- deal stage movement
- task completion and reopening
- archive and restore
- invitation creation, resend, revoke, and acceptance
- role and membership changes
- inbox assignment, status, tags, notes, send, and retry

Each event records workspace, actor, entity type, entity ID, action, label,
timestamp, source, and a safe before/after diff where useful. Passwords, tokens,
cookies, provider secrets, database URLs, and raw authentication responses are
never included.

Audit writes for business mutations occur inside the same transaction as the
mutation so that the record and its audit history cannot diverge.

## 10. Figma Screen Coverage

Primary navigation and routes follow the seven PhilInspect Figma flows.

### 10.1 Overview

- Dashboard summary metrics
- Pipeline summary
- Tasks and due-state presentation
- Recent activity
- Responsive dashboard states

### 10.2 Leads

- Lead list and filters
- Create and edit states
- Lead detail
- Qualification/status actions
- Conversion flow and confirmation/error states

### 10.3 Deals

- Pipeline board
- Deal list
- Create and edit states
- Deal detail
- Activity view
- Resources view
- Stage movement and outcome states

### 10.4 Clients and users

- Contacts list/detail/create/edit
- Companies list/detail/create/edit
- Related-record sections
- User/member list
- Invite-member flow
- Role and membership states

### 10.5 Inbox

- Messaging-account filters
- Conversation list
- Message thread
- Customer context
- Compose panel
- Assignment, status, tags, notes, unread, simulated send, and retry

The inbox remains provider-neutral and mock-backed for this MVP. It must not
make network calls to live messaging providers.

### 10.6 Business and system

- Audit log list, filters, and detail
- Workspace settings and access states
- Figma-defined operational screens
- Deferred billing/revenue/marketplace/domain/custom-field screens rendered as
  complete read-only `Coming soon` states

### 10.7 Inspections

- Inspection list and filtering
- Inspection create/edit and assignment states represented in Figma
- Inspection detail and persistent status changes
- Figma-defined inspection report viewer
- Safe seeded demonstration report content; advanced report generation remains
  deferred

### 10.8 Tasks and authentication

- A dedicated task screen in addition to contextual task views
- Sign-in
- Invitation acceptance/onboarding
- Access denied
- Expired/revoked invitation
- Loading and recoverable authentication failure

Old POC navigation that is absent from the approved PhilInspect product is
removed from primary navigation or redirected to its replacement. `Brands`
redirects to `Companies` after migration.

Each screen includes the Figma-defined tabs, modals, tables, filters, hover and
focus states, loading states, empty states, error states, and responsive
replacements. Visual verification uses the viewport matrix defined in the design
contract.

## 11. Validation and Error Handling

- All server inputs are parsed by resource-specific schemas.
- Forms display field-level validation and preserve safe entered values.
- Submit controls prevent duplicate mutation requests.
- Services distinguish unauthenticated, forbidden, not found, conflict, invalid,
  and retryable infrastructure errors.
- User-visible errors do not expose SQL, tokens, tenant identifiers, or provider
  responses.
- Destructive actions require confirmation and use archive/soft delete by
  default.
- Optimistic updates are limited to reversible actions and roll back on failure.
- Empty datasets, filter misses, Neon cold starts, and transient failures have
  explicit UI states.

## 12. Migration Strategy

1. Capture the existing database and deployment rollback references.
2. Add membership, invitation, core CRM, inspection, stage, audit, and tenant
   columns in nullable/backfillable form where necessary.
3. Resolve the existing PhilInspect workspace and initial administrator.
4. Backfill `workspace_id` onto every legacy CRM and system record.
5. Migrate Brands into Companies while preserving identifiers or explicit
   relationship mappings.
6. Seed workspace-scoped pipeline stages.
7. Verify row counts, relationships, and orphan detection.
8. Add non-null constraints, tenant-relative unique constraints, and composite
   tenant indexes.
9. Replace page-level and unscoped data access with scoped services.
10. Remove the demo organization fallback and deprecated data paths.

No migration targets the reserved production branch. No existing Neon project,
branch, repository, or deployment is deleted.

## 13. Testing Strategy

### 13.1 Unit tests

- Permission matrix and ownership rules
- Validation schemas
- Stage ordering and transition rules
- Lead conversion decisions and idempotency
- Audit diff creation and secret filtering
- Error translation

### 13.2 Integration tests

- CRUD for contacts, companies, leads, deals, and tasks
- Inspection creation/update/status behavior shown in Figma
- Same-workspace relationship enforcement
- Cross-workspace read, update, relationship, and delete denial
- Membership and invitation bootstrap behavior
- Invitation expiry, revoke, mismatch, resend, and idempotent acceptance
- Lead conversion transaction and rollback
- Deal movement history/activity/audit transaction
- Archive and restore
- Audit creation for meaningful mutations
- Migrations from an empty schema and from the current legacy schema shape

Integration tests use an isolated test database or schema and never mutate the
reserved production branch.

### 13.3 End-to-end tests

The primary flow is:

1. Sign in as the preserved administrator.
2. Create a company.
3. Create a contact associated with that company.
4. Create a lead.
5. Convert or link the lead into a deal.
6. Create and complete a related task.
7. Move the deal to another pipeline stage.
8. Verify activity and audit history.
9. Create an inspection and persist a status change.
10. Invite and sign in as a restricted Sales user.
11. Verify allowed assigned-record behavior.
12. Verify forbidden user-management, settings, audit, cross-owner, and archive
    operations fail at the server boundary.
13. Trigger and retry a simulated recoverable failure without duplicate data.

Additional end-to-end coverage verifies protected-route redirects, invitation
errors, core filters/forms, inbox regression behavior, responsive navigation,
and deferred-module read-only states.

### 13.4 Visual and quality gates

- Screenshot verification for every Figma route and important modal/state at
  `1440x1000`, `1024x768`, `768x1024`, `390x844`, and `360x800` where applicable.
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- Playwright end-to-end suite

Lint warnings and errors introduced or exposed by the MVP work must be fixed;
the quality gate may not pass by disabling relevant rules or excluding product
code from checks.

## 14. Staging Release and Rollback

- Application changes are committed and pushed only to GitHub `staging`.
- Database migrations run only on the PhilInspectCRM Neon `staging` branch.
- The current Vercel project continues to serve staging.
- No production Vercel project or production Neon migration is created.
- Preview/local checks run before the stable staging alias changes.
- The prior ready Vercel deployment remains a rollback target.
- Database recovery information is recorded without committing secrets.
- Live verification uses dedicated test identities and does not intentionally log
  out the user's current authenticated account.

## 15. MVP Acceptance Criteria

The CRM is an MVP only when current evidence proves all of the following:

- Every approved PhilInspect Figma screen is implemented and visually verified.
- Authentication, organization resolution, membership, and invitations work.
- The preserved initial admin can access the application after migration.
- Contacts, companies, leads, deals, and tasks pass functional CRUD tests.
- Figma-defined inspection management and status behavior work and are audited.
- A lead can create or link the records needed for a deal without duplicates.
- A deal moves persistently across pipeline stages in board and accessible views.
- Every server operation proves both permission and workspace scope.
- Cross-tenant tests cover reads, writes, relationships, and destructive actions.
- Meaningful mutations create safe, correctly scoped audit events.
- The existing mock inbox continues to pass its behavioral tests.
- Deferred modules are visually represented but cannot perform unsupported
  mutations.
- Lint, typecheck, unit/integration tests, production build, Playwright, and
  visual checks pass.
- The deployed staging application passes the complete administrator and
  restricted-user acceptance flow.

The removed per-customer GitHub/Neon/Vercel provisioning flow is not an MVP
acceptance criterion.
