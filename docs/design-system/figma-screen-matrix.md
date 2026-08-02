# PhilInspect CRM Figma screen matrix

Date: 2026-08-02  
Source: read-only `Philinspect CRM` Figma file (`PZQZcN7DmZT8oZ8KyXOWVr`)  
Status values: `missing`, `partial`, `matched`

This is the authoritative acceptance inventory for PhilInspect product screens.
No entry may be removed or marked `matched` without a fixed-size visual check and
the named browser test. Figma is read-only; implementation happens only in this
repository.

## Evidence notes

- The Figma page tree was revisited in the owner's authenticated, read-only tab.
- Exact visible frame names were recorded for Overview, Leads, and Inspections.
- Deals, Clients/Users, Inbox, and Business/System states are mapped from their
  named Figma flow groups together with the existing design contract and prior
  visual review. Their final exact frame labels must be reconfirmed if structured
  Figma metadata becomes available.
- Authentication is an application-required flow. It uses the same foundations
  even where no dedicated product frame is visible in the PhilInspect page tree.

## Route and state matrix

| Figma flow | Frame/state | Target route or state | Viewport | Current | Screenshot/test name |
| --- | --- | --- | --- | --- | --- |
| 01 Overview | `Dashboard / Desktop` | `/` | 1440x1000 | partial | `overview-desktop.png` |
| 01 Overview | responsive dashboard | `/` | 390x844 | missing | `overview-mobile.png` |
| 02 Leads Flow | `Leads / Desktop` | `/leads` | 1440x1000 | partial | `leads-desktop.png` |
| 02 Leads Flow | `Leads / Status Dropdown Open / Desktop` | `/leads?fixture=status-open` | 1440x1000 | missing | `leads-status-open.png` |
| 02 Leads Flow | `Leads / Segment Dropdown Open / Desktop` | `/leads?fixture=segment-open` | 1440x1000 | missing | `leads-segment-open.png` |
| 02 Leads Flow | lead create | `/leads/new` | 1440x1000 | missing | `lead-create.png` |
| 02 Leads Flow | lead detail/edit | `/leads/[leadId]` | 1440x1000 | missing | `lead-detail.png` |
| 02 Leads Flow | lead conversion | `/leads/[leadId]?fixture=convert` | 1440x1000 | missing | `lead-convert.png` |
| 03 Deals Flow | deals pipeline board | `/deals` | 1440x1000 | partial | `deals-board.png` |
| 03 Deals Flow | deals list | `/deals?view=list` | 1440x1000 | partial | `deals-list.png` |
| 03 Deals Flow | deal create | `/deals/new` | 1440x1000 | missing | `deal-create.png` |
| 03 Deals Flow | deal active/detail | `/deals/[dealId]` | 1440x1000 | missing | `deal-detail-active.png` |
| 03 Deals Flow | deal activity | `/deals/[dealId]?tab=activity` | 1440x1000 | missing | `deal-activity.png` |
| 03 Deals Flow | deal resources | `/deals/[dealId]?tab=resources` | 1440x1000 | missing | `deal-resources.png` |
| 03 Deals Flow | stage movement | `/deals?fixture=stage-moved` | 1440x1000 | missing | `deals-stage-moved.png` |
| 04 Clients and Users | company list | `/companies` | 1440x1000 | missing | `companies-list.png` |
| 04 Clients and Users | company create | `/companies/new` | 1440x1000 | missing | `company-create.png` |
| 04 Clients and Users | company detail/edit | `/companies/[companyId]` | 1440x1000 | missing | `company-detail.png` |
| 04 Clients and Users | contact list | `/contacts` | 1440x1000 | missing | `contacts-list.png` |
| 04 Clients and Users | contact create | `/contacts/new` | 1440x1000 | missing | `contact-create.png` |
| 04 Clients and Users | contact detail/edit | `/contacts/[contactId]` | 1440x1000 | missing | `contact-detail.png` |
| 04 Clients and Users | users/member list | `/users` | 1440x1000 | partial | `users-list.png` |
| 04 Clients and Users | invite member | `/users?fixture=invite-open` | 1440x1000 | missing | `users-invite-open.png` |
| 04 Clients and Users | role edit | `/users?fixture=role-open` | 1440x1000 | missing | `users-role-open.png` |
| 05 Inbox Flow | inbox workspace | `/inbox` | 1440x1000 | partial | `inbox-desktop.png` |
| 05 Inbox Flow | inbox empty/filter state | `/inbox?fixture=empty` | 1440x1000 | partial | `inbox-empty.png` |
| 05 Inbox Flow | compose/reply panel | `/inbox?fixture=compose` | 1440x1000 | partial | `inbox-compose.png` |
| 05 Inbox Flow | compact inbox | `/inbox` | 390x844 | partial | `inbox-mobile.png` |
| 06 Business and System | tasks | `/tasks` | 1440x1000 | missing | `tasks-list.png` |
| 06 Business and System | task create/edit | `/tasks?fixture=editor-open` | 1440x1000 | missing | `task-editor.png` |
| 06 Business and System | revenue deferred | `/revenue` | 1440x1000 | partial | `revenue-coming-soon.png` |
| 06 Business and System | bills deferred | `/bills` | 1440x1000 | partial | `bills-coming-soon.png` |
| 06 Business and System | settings | `/settings` | 1440x1000 | partial | `settings-desktop.png` |
| 06 Business and System | audit logs | `/audit-logs` | 1440x1000 | partial | `audit-logs.png` |
| 07 Inspections Flow | `Proposals / Desktop` | `/inspections` | 1440x1000 | partial | `inspections-list.png` |
| 07 Inspections Flow | inspection create/edit | `/inspections/new` and `/inspections/[inspectionId]` | 1440x1000 | missing | `inspection-editor.png` |
| 07 Inspections Flow | `Inspection / Report Viewer / Desktop` | `/inspections/[inspectionId]/report` | 1440x1000 | missing | `inspection-report-viewer.png` |
| Authentication | sign in | `/auth/sign-in` | 1440x1000 | partial | `auth-sign-in.png` |
| Authentication | sign up | `/auth/sign-up` | 1440x1000 | partial | `auth-sign-up.png` |
| Authentication | no membership | `/onboarding` | 1440x1000 | missing | `onboarding-no-membership.png` |
| Authentication | accept invitation | `/invitations/[token]` | 1440x1000 | missing | `invitation-accept.png` |
| Authentication | forbidden | route-level forbidden state | 1440x1000 | missing | `forbidden.png` |

## Visual acceptance sizes

Every primary route must pass at `1440x1000`. Shell and responsive replacement
behavior must additionally pass at `1024x768`, `768x1024`, `390x844`, and
`360x800`. State-specific desktop screenshots may reuse the primary route's
responsive coverage where the same shell and controls are exercised.

## Definition of matched

An entry can move to `matched` only when:

1. its route and state are reachable without mutating production data;
2. its fixture or test data is deterministic;
3. its screenshot has been compared with the relevant Figma frame;
4. keyboard focus, empty, loading, validation, and permission behavior is tested
   where applicable; and
5. the route performs no unauthorized or cross-workspace server operation.
