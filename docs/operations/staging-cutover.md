# PhilInspectCRM Staging Cutover

Date: 2026-07-21  
Status: PhilInspectCRM staging branch initialized; application cutover pending

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
| Local Git branch | `agent/bootstrap-crm-poc` | Commit `3818f05` |
| Vercel team | `team_DHwCmuGXBLaeVKKqntMbikjH` | Existing team retained |
| Vercel project | `prj_TA6Km0gpwns0e44xhubAM3ARNG1a` | `crm-symph-poc` |
| Ready Vercel deployment | `dpl_DoAqbBq1Knh9FR2wiFkkzHPRMdbV` | Ready deployment retained |
| Stable Vercel URL | `crm-symph-poc.vercel.app` | Current rollback entry point |
| Older local Neon project | `holy-pond-71585430` | Retain; do not delete |
| Target Neon project | `curly-block-65583676` | `PhilInspectCRM` |
| Target Neon primary branch | `br-broad-lake-azseiabj` | Reserved for future production |
| Target Neon staging branch | `br-purple-base-azltwlq4` | Application migrations and fictional data only |

At baseline, PhilInspectCRM contains the `neon_auth` schema and no CRM application tables. Its primary branch is ready and must remain unchanged during the staging implementation.

The isolated `staging` child branch was created from the primary branch and initialized with the existing migration and deterministic fictional seed. Verified staging counts are 12 users, 400 leads, 148 brands, 163 deals, 30 conversations, 90 messages, and 1,855 audit logs. A post-migration inspection confirmed the primary branch still contains only Neon Auth tables.

## Pre-cutover verification

The existing application passed:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

The baseline build exposed `/`, `/[feature]`, and the framework not-found route.

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

This section will be updated with safe branch, GitHub, deployment, and check results after staging is live. Secret values and connection strings must never be added.
