# PhilInspectCRM Staging Cutover

Date: 2026-07-21  
Status: Local application implementation complete; GitHub authentication blocks remote cutover

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
| Local Git branch | `agent/bootstrap-crm-poc` | Verified implementation commit `32052ce` |
| Vercel team | `team_DHwCmuGXBLaeVKKqntMbikjH` | Existing team retained |
| Vercel project | `prj_TA6Km0gpwns0e44xhubAM3ARNG1a` | `crm-symph-poc` |
| Ready Vercel deployment | `dpl_DoAqbBq1Knh9FR2wiFkkzHPRMdbV` | Ready deployment retained |
| Stable Vercel URL | `crm-symph-poc.vercel.app` | Current rollback entry point |
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

Playwright coverage now includes protected-route redirect, sign-up/sign-out, channel filtering, persistent send, deterministic auto-reply, status, tag, internal note, fail-once retry, and duplicate prevention. The first browser run found and led to fixes for pre-hydration native form submission, cross-origin test configuration, and concurrent workspace bootstrap. The required post-fix Chromium rerun remains pending because the execution environment reached its external-execution usage limit.

## Cutover order

1. Create a persistent PhilInspectCRM child branch named `staging`.
2. Point ignored local environment values to that branch.
3. Apply migrations and deterministic fictional seed data only to `staging`.
4. Implement and verify Neon Auth and the mock unified inbox locally.
5. Push the verified history to the private GitHub `staging` branch.
6. Connect the existing Vercel project to GitHub `staging`.
7. Replace that project's environment values with PhilInspectCRM staging values.
8. Deploy and run staging smoke tests.

## Rollback order

If the staging cutover fails:

1. Stop new staging deployment attempts.
2. Re-point the stable Vercel alias to the recorded ready deployment if it changed.
3. Restore the previous Vercel environment-variable configuration from provider history without printing values.
4. Restore the preserved ignored local environment file.
5. Keep the PhilInspectCRM staging branch for diagnosis unless deletion is explicitly approved.
6. Confirm the older Neon project and PhilInspectCRM primary branch were not modified.

## Final verification record

Local and Neon staging implementation is complete through the browser-test checkpoint. The Git worktree is clean and the full non-browser gate passes.

Remote cutover is intentionally paused because `gh auth status` reports that the saved `jcbags101` token is invalid. No GitHub repository was created, no branch was pushed, no Vercel Git integration or environment value was changed, and the rollback deployment remains untouched. Resume with:

```text
gh auth login -h github.com
gh auth status
```

After authentication, create the private empty `philinspect-crm` repository, publish only `staging`, connect the existing Vercel project to that branch, replace its Production-target variables with the already prepared Neon staging values, deploy, and run the pending Chromium suite against the stable URL. Secret values and connection strings must never be added to this record.
