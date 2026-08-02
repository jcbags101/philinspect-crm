# PhilInspectCRM Staging Cutover

Date: 2026-07-23
Status: Staging cutover complete and browser-verified

## Guardrails

- The current Vercel project is the staging application.
- GitHub `staging` will be the only deployed source branch.
- Do not push application changes to `main`.
- Do not migrate or seed the PhilInspectCRM primary branch.
- Do not create a production Vercel project until the owner explicitly approves go-live.
- Do not delete the older Neon project during this cutover.
- Never record database URLs, passwords, auth cookie secrets, or tokens in this file.

## Rollback baseline

| Resource | Safe identifier | Baseline |
|---|---|---|
| GitHub repository | `jcbags101/philinspect-crm` | Private repository |
| Git branch | `staging` | Only published and deployed source branch |
| Vercel team | `team_DHwCmuGXBLaeVKKqntMbikjH` | Existing team retained |
| Vercel project | `prj_TA6Km0gpwns0e44xhubAM3ARNG1a` | `crm-symph-poc` |
| Previous Vercel deployment | `dpl_DoAqbBq1Knh9FR2wiFkkzHPRMdbV` | Pre-cutover rollback reference retained |
| Browser-verified Vercel deployment | `dpl_G2JYAWnfYHMwAwtYwJNsNdWAiDD5` | READY Production-target staging deployment |
| Stable staging URL | `crm-symph-poc.vercel.app` | Aliased to the verified deployment |
| Older local Neon project | `holy-pond-71585430` | Retain; do not delete |
| Target Neon project | `curly-block-65583676` | `PhilInspectCRM` |
| Target Neon primary branch | `br-broad-lake-azseiabj` | Reserved for future production |
| Target Neon staging branch | `br-purple-base-azltwlq4` | Application migrations and fictional data only |

At baseline, PhilInspectCRM contains the `neon_auth` schema and no CRM application tables. Its primary branch is ready and must remain unchanged during the staging implementation.

The isolated `staging` child branch was created from the primary branch and initialized with the reviewed migrations and deterministic fictional seed. The final RelayDesk fixture contains 4 messaging accounts, 24 conversations, 168 chronological messages, 68 delivery attempts, 4 tags, 6 unread conversations, and 5 unassigned conversations. Two seed passes completed successfully with the same identifiers and counts. A post-migration inspection confirmed the primary branch still has zero application tables.

## Pre-cutover verification

The existing application passed:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

The current implementation passes `npm run check` and exposes dedicated authentication, auth API, and inbox routes in addition to the existing CRM routes. A direct auth smoke check verified a disposable user could sign up through the staging branch's Neon Auth endpoint, receive a session, and load the authenticated inbox.

Playwright coverage includes protected-route redirect, sign-up/sign-out, channel
filtering, persistent send, deterministic auto-reply, status, tag, internal
note, fail-once retry, and duplicate prevention. Live verification also found
and led to fixes for:

- pre-hydration native form submission;
- concurrent workspace bootstrap;
- a Neon Auth middleware redirect affecting authenticated Next.js Server
  Actions;
- a missing `type="submit"` on the internal-note form;
- browser assertions that depended on mutable conversation ordering.

The stable staging URL passed the complete Chromium suite:

```text
3 passed (1.3m)
```

The non-browser gate also passes:

```text
npm run check
```

## Cutover order

1. Created a persistent PhilInspectCRM child branch named `staging`.
2. Pointed ignored local environment values to that branch.
3. Applied migrations and deterministic fictional seed data only to `staging`.
4. Implemented and verified Neon Auth and the mock unified inbox.
5. Published the private GitHub repository with only the `staging` branch.
6. Connected the existing Vercel project with `productionBranch: staging`.
7. Replaced the Vercel Production-target database and Auth bindings with
   PhilInspectCRM staging values.
8. Added the stable Vercel URL to the staging branch's Neon Auth trusted
   origins.
9. Deployed and completed live browser verification.

## Rollback order

If the staging cutover fails:

1. Stop new staging deployment attempts.
2. Re-point the stable Vercel alias to the recorded ready deployment if it changed.
3. Restore the previous Vercel environment-variable configuration from provider history without printing values.
4. Restore the preserved ignored local environment file.
5. Keep the PhilInspectCRM staging branch for diagnosis unless deletion is explicitly approved.
6. Confirm the older Neon project and PhilInspectCRM primary branch were not modified.

## Final verification record

- GitHub authentication is valid for `jcbags101`.
- `jcbags101/philinspect-crm` is private and publishes only `staging`.
- The Vercel project remains staging-only and maps its Production target to
  GitHub `staging`.
- The stable URL serves a READY deployment containing the internal-note and
  authenticated Server Action fixes.
- Neon Auth accepts the stable staging origin.
- Live browser verification passes all three auth and inbox scenarios.
- The PhilInspectCRM primary branch still has zero public application tables.
- No real Messenger, Instagram, Viber, Meta, or other provider API is connected.
- No database URL, password, cookie secret, access token, or customer data is
  stored in Git or this record.

The application fix release initially used an authenticated Vercel CLI fallback
because its Git webhook was delayed. The following documentation push produced
a READY Git-sourced deployment from GitHub `staging`, confirming that the
integration recovered and still uses `productionBranch: staging`.

## 2026-08-02 pre-MVP implementation baseline

This section freezes the state immediately before the tenant-safe CRM MVP work.
It supplements the original cutover record; it does not replace or broaden the
staging-only guardrails above.

### Source and deployment

- Local branch: `staging`
- Published baseline: `origin/staging` at `a2503a7` (`Fix infinite signup loading`)
- Local approved design commit: `69d9917`
- Local approved implementation-plan commit: `a051db9`
- Git remote: private `jcbags101/philinspect-crm`
- Vercel project: `prj_TA6Km0gpwns0e44xhubAM3ARNG1a`
- Stable staging alias: `crm-symph-poc.vercel.app`
- Drizzle journal: migrations `0000` through `0003`

No production project or deployment was created. No branch was pushed during
this baseline audit.

### Database snapshot

The connected runtime database was inspected with read-only queries. It reported
database `neondb`, schema `public`, one workspace, and the existing fictional
demo data. Material CRM counts were:

| Table | Rows |
| --- | ---: |
| workspaces | 1 |
| users | 53 |
| roles | 3 |
| user_roles | 53 |
| leads | 400 |
| deals | 163 |
| deal_stage_history | 163 |
| brands | 148 |
| activities | 180 |
| audit_logs | 1,917 |
| conversations | 24 |
| messages | 201 |

This is a count-only rollback reference. No row contents, authentication data,
connection strings, tokens, or secrets were recorded. Existing migrations do
not yet provide the membership, invitation, company, contact, task, and fully
workspace-scoped CRM model required by the approved MVP.

### Verification result

The clean pre-MVP baseline passed on 2026-08-02:

```text
npm run check
  lint: passed
  typecheck: passed
  unit tests: 3 files, 7 tests passed
  Next.js 16.2.10 production build: passed

npm run test:e2e
  Chromium: 5 tests passed (43.4s)
```

Current route output is limited to the generic overview/dynamic feature pages,
authentication, design-system gallery, and mock unified inbox. The primary known
gaps are tenant-scoped memberships/invitations, removal of the demo-session
fallback, centralized RBAC, scoped repositories, Contacts/Companies/Tasks,
functional CRM CRUD, lead conversion, persistent deal-stage movement,
inspection workflows, and full Figma visual coverage.

The browser verification used an isolated Playwright context and did not sign
out or alter the owner's existing authenticated browser session.

### MVP migration rehearsal

- Isolated Neon test branch: `br-cold-surf-az7qnz7c` (`test`)
- Parent: reserved `production` branch; the test branch contains no production
  application data.
- The test branch was reset to its parent before the final rehearsal.
- Migrations `0000` through `0004` applied successfully from scratch.
- The tenant schema suite passed 2 files and 9 tests.
- The updated deterministic fictional seed completed successfully.
- The read-only verifier confirmed 29 tenant tables, complete deal-stage
  coverage, active membership coverage, and initial-admin preservation.

The staging database has not received migration `0004` at this point. Its
pre-MVP rollback counts above remain the authoritative staging baseline until a
separate staging migration step is recorded.
