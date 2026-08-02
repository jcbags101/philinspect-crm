# PhilInspect CRM MVP verification

Date: 2026-08-02  
Branch: `staging`

This record distinguishes implemented behavior from fully proven acceptance.
The CRM is not marked complete while authenticated browser acceptance and live
Figma comparison remain outstanding.

## Proven automated boundaries

| Boundary | Evidence | Result |
| --- | --- | --- |
| Lint and TypeScript | `npm run lint`, `npm run typecheck` | passed |
| Unit behavior | 7 files, 27 Vitest tests | passed |
| Tenant/RBAC/CRUD behavior | isolated Neon test branch, 13 files, 48 integration tests | passed |
| Production compilation | Next.js 16 production build | passed |
| Public auth boundary | Playwright: protected route redirect, bounded invalid sign-in, invitation-only sign-up copy | passed locally and on staging |
| Public design system | Playwright desktop interactions and 390x844 responsive state | passed locally and on staging |
| Vercel deployment | Git-triggered staging deployment for reviewed commit `c2acb88` | ready |

The integration suite covers workspace isolation, role authorization, member and
invitation rules, companies, contacts, leads and conversion, deals and pipeline
movement, tasks, inspections, dashboard aggregation, audit logs, and settings.

## Implemented browser acceptance

`tests/e2e/crm-core.spec.ts` now describes a recoverable acceptance story using
dedicated accounts:

1. sign in as an invited admin;
2. create a company, contact, lead, deal, task, and inspection;
3. move the deal to another persisted stage;
4. open the inspection report;
5. archive all created entities;
6. sign in as an invited sales user;
7. verify manager-only pages route to `/forbidden` without changing data.

The test requires `PLAYWRIGHT_ADMIN_EMAIL`, `PLAYWRIGHT_ADMIN_PASSWORD`,
`PLAYWRIGHT_SALES_EMAIL`, and `PLAYWRIGHT_SALES_PASSWORD`. Recoverable staging
mutations additionally require the explicit `PLAYWRIGHT_ALLOW_MUTATIONS=1`
flag. Inbox persistence tests use the same dedicated admin credentials. These
tests are intentionally not run implicitly.

## Outstanding proof

- Run the authenticated CRM and inbox browser suites with dedicated invited
  admin and sales test accounts.
- Capture fixed-size screenshots for every row in the Figma screen matrix.
- Compare those screenshots against fresh `get_design_context` output from the
  approved Figma file.
- Add deterministic fixture states for the remaining dropdown/open-state rows.

## Current external blocker

The connected Figma Professional View seat returned a plan call-limit error on
2026-08-02. No visual row was promoted to `matched` using inferred or stale
evidence. Live Figma verification can resume when that account can make MCP
reads again.
