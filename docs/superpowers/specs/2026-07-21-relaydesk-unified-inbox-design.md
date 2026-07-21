# RelayDesk Unified Inbox and Staging Foundation Design

Date: 2026-07-21  
Status: Approved for implementation planning  
Application: `crm-symph-poc`  
Target database: Neon project `PhilInspectCRM`

## 1. Goal

Build a realistic, persistent unified-messaging demonstration inside the CRM. The inbox will resemble a production omnichannel workspace while remaining completely isolated from real Messenger and Instagram accounts.

The same implementation must establish `PhilInspectCRM` as the application's Neon and Neon Auth foundation and introduce a staging-first GitHub, Vercel, and Neon delivery workflow.

## 2. Scope

The approved POC includes:

- Multiple fictional Messenger and Instagram account identities.
- A unified conversation queue with channel, account, assignment, unread, and tag filters.
- Persistent conversations, messages, internal notes, assignments, tags, and delivery states in Neon.
- A full message thread and composer.
- Deterministic simulated sending, delivery, failure, retry, and customer-reply behavior.
- Neon Auth for login, sessions, and organizations.
- Server-side CRM authorization and audit logging.
- A staging-only deployment sourced from the GitHub `staging` branch.
- Drizzle migrations, deterministic fictional seed data, and browser verification.

## 3. Explicit Non-Goals

This phase will not:

- Connect Facebook Pages or Instagram professional accounts.
- Store Meta access tokens or secrets.
- Receive Meta webhooks.
- Send messages to any external API.
- Publish the RelayDesk Connect Meta app.
- Request Meta App Review or Advanced Access.
- Create or deploy a production Vercel project.
- Deploy from or push application changes to GitHub `main`.
- Introduce a shared GitHub `develop` branch while there is only one active developer.
- Add Viber, WhatsApp, email, or another live provider.

The existing RelayDesk Connect Meta Developer App remains unpublished and parked for a later, separately approved production-integration phase.

## 4. Architecture

The inbox will use three boundaries.

### 4.1 Inbox interface

The dedicated `/inbox` route renders account filters, conversation search and filtering, the selected conversation, customer context, assignment controls, tags, notes, and the composer.

The generic records table currently used by the inbox will not remain the inbox implementation. Server components load initial data. Focused client components handle selection, filtering, composing, optimistic feedback, and responsive navigation.

### 4.2 Inbox service and repositories

Repository modules own database access. The inbox service owns business rules, authorization, audit writes, message idempotency, assignment changes, unread changes, notes, tags, and delivery-state transitions.

UI components and route handlers must not query Drizzle directly. Every mutation passes through the service layer and enforces the authenticated organization and user on the server.

### 4.3 Messaging adapter

The application exposes a provider-neutral adapter contract with operations equivalent to:

- list or synchronize accounts;
- list or synchronize conversations;
- list messages;
- send a message;
- retry a failed message;
- report connection health.

`MockMessagingAdapter` is the only implementation in this phase. A future `MetaMessagingAdapter` can implement the same contract without changing the core inbox UI or service rules.

## 5. Data Model

The existing engagement schema will be extended rather than replaced.

### 5.1 Workspace and identity links

- Add an application workspace record linked to a Neon Auth organization identifier.
- Link application users to Neon Auth user identifiers.
- Keep CRM roles and user-role assignments in the application schema.
- Scope all inbox accounts, conversations, messages, tags, notes, and audit records by workspace.

Neon Auth is the source of truth for authentication, sessions, and organization membership. The application schema remains the source of truth for CRM permissions.

The staging sign-in flow uses Neon Auth email and password. The first staging owner signs up interactively, then the application creates the matching workspace and application-user record on first authenticated access. No password or prebuilt session is committed or inserted by the seed script. Social OAuth is deferred. The current client-only persona selector may remain as a visual demonstration control, but it cannot grant permissions or replace the authenticated server session.

### 5.2 Messaging accounts

Each mock messaging account stores:

- workspace;
- provider type (`messenger` or `instagram`);
- fictional external account identifier;
- display name, avatar fixture, and handle;
- connection state;
- synchronization state and last synchronized timestamp;
- fixture configuration used by the mock adapter;
- created and updated timestamps.

No credential or token column is needed for the mock phase.

### 5.3 Conversations

Each conversation stores:

- workspace and messaging account;
- fictional provider conversation identifier;
- participant identity and avatar fixture;
- optional CRM brand and lead associations;
- subject or context label;
- assignee;
- last-message timestamp;
- unread count and unread state;
- status (`open`, `pending`, or `resolved`);
- created and updated timestamps.

### 5.4 Messages

Each message stores:

- workspace and conversation;
- a unique client idempotency key;
- fictional provider message identifier;
- direction (`inbound`, `outbound`, or `internal`);
- sender label and optional application user;
- message body and bounded attachment fixtures;
- delivery state (`queued`, `sent`, `delivered`, `read`, or `failed`);
- failure code and safe failure message when applicable;
- sent, delivered, read, created, and updated timestamps.

Internal notes use the same chronological thread but are visually distinct and never pass to the messaging adapter.

### 5.5 Tags and audit records

Tags are workspace-scoped and linked to conversations through a join table. Assignment, tag, note, unread, status, send, retry, and reset mutations create audit events.

## 6. User Experience

### 6.1 Desktop

Desktop uses a three-column workspace:

1. Accounts and filters.
2. Conversation list.
3. Conversation thread and customer context.

The account column includes All inboxes, Messenger, Instagram, specific mock accounts, Unread, Assigned to me, and Unassigned. It also shows simulated connection and synchronization health.

The conversation list includes participant, avatar, source account, channel, latest-message preview, timestamp, unread count, assignee, and tags. Search covers participant labels and message content.

The thread includes chronological messages, delivery/read indicators, text and simulated attachment composition, assignment, unread, tags, internal notes, and related CRM context. A persistent `Demo — no external message sent` indicator is visible near the composer.

### 6.2 Mobile

Mobile uses two navigable screens: the conversation list and the selected thread. Opening a conversation moves to the thread. Back navigation returns to the list without losing filters.

### 6.3 Demo behavior

An outbound message is persisted first with `queued` state. The mock adapter then deterministically transitions it to `sent`, `delivered`, and optionally `read`. Selected fixture scenarios may fail once and succeed on retry. Eligible fixture conversations can generate one deterministic inbound response after a successful outbound message.

All behavior remains stable across refreshes and repeated seed resets.

## 7. Data and Mutation Flow

### 7.1 Initial load

1. Neon Auth resolves the session and organization.
2. The server maps the organization to an application workspace and checks the user's CRM role.
3. The inbox service requests account summaries and the first page of conversations from repositories.
4. The server renders the inbox shell and initial selection.
5. Client navigation requests only the selected thread or changed filter result.

### 7.2 Sending a mock message

1. The client creates an idempotency key and submits the message.
2. The service validates the session, workspace, permission, conversation, and body.
3. A transaction inserts the queued outbound message and audit event.
4. The service invokes `MockMessagingAdapter` with the persisted message identifier.
5. The adapter returns the next deterministic delivery outcome.
6. The service persists state changes and an optional inbound fixture response.
7. The UI reconciles optimistic feedback with the persisted result.

Repeated submissions with the same idempotency key return the original message instead of creating duplicates.

### 7.3 Operational mutations

Assignment, tagging, unread, status, and internal-note operations validate workspace ownership and role permissions before performing transactional writes and audit events.

## 8. Error Handling

- Missing or expired sessions redirect to sign-in.
- Cross-workspace resource identifiers return a not-found response and never reveal resource existence.
- Permission failures render a dedicated permission state.
- Validation errors remain near the affected field.
- Message-send failures remain in the thread with a safe reason and retry action.
- Retrying preserves the original message and appends delivery-attempt history rather than duplicating visible content.
- Database failures return a recoverable page or toast and do not simulate success.
- Loading and empty states exist for accounts, conversations, search results, and threads.
- Mock synchronization errors are visible per account and recover through a simulated retry.

## 9. Neon and Authentication Foundation

`PhilInspectCRM` replaces the older Neon project currently referenced by local and Vercel environment variables.

The existing `PhilInspectCRM` primary branch remains reserved for future production. It already contains the provisioned `neon_auth` schema. A new persistent Neon `staging` branch is created from the primary branch. Existing Drizzle migrations and the new inbox migrations are applied to `staging`, followed by deterministic fictional seed data.

The staging application uses the staging branch's pooled runtime URL, direct migration URL, Neon project identifier, and branch-specific Neon Auth URL. Secrets remain in Vercel or ignored local environment files.

The old Neon project is not deleted during this phase. It remains available for rollback until the staging cutover is verified and a separate cleanup is explicitly approved.

## 10. GitHub, Vercel, and Neon Delivery Model

### 10.1 Active staging flow

- The current local repository is pushed to a private GitHub repository named `philinspect-crm`.
- Its existing history becomes the GitHub `staging` branch; no application commit is pushed to `main` in this phase.
- `staging` is the only active shared deployment branch.
- The current Vercel project is treated as the staging application.
- Its Vercel Production Branch setting tracks GitHub `staging` so the project has a stable staging URL.
- Its Vercel Production environment variables point only to the Neon `staging` branch.
- Direct pushes or approved merges to `staging` trigger the staging deployment.
- The local single-developer environment uses the same fictional staging dataset during this POC; reset is explicit and never runs automatically during build or startup.

The word `Production` in the current Vercel project's technical target means the stable target for that Vercel project. Operationally, that entire project is staging and contains no live customer data.

### 10.2 Deferred environments

- GitHub `main` is reserved and does not deploy an application in this phase.
- A separate production Vercel project will be created only after an explicit go-live instruction.
- That future project will track `main` and use the Neon primary `production` branch.
- GitHub `develop` and a shared deployed development environment will be introduced only when more developers join.
- Feature-branch previews and automatic per-PR Neon branches are deferred until the multi-developer workflow is activated.

### 10.3 Migration and deployment order

For staging changes:

1. Generate and inspect Drizzle migrations locally.
2. Run lint, type checking, and unit tests.
3. Apply backward-compatible migrations to Neon `staging`.
4. Build and deploy the `staging` branch to the current Vercel project.
5. Run browser smoke tests against the stable staging URL.
6. Keep the previous ready Vercel deployment available for rollback.

No pipeline step writes to the Neon primary branch or creates a production deployment.

## 11. Security and Privacy

- All people, organizations, messages, and attachments are fictional.
- No source CRM data is copied.
- No Meta secrets, tokens, webhook signatures, or customer credentials are stored.
- Server-side organization scoping is mandatory for every query and mutation.
- Authentication and authorization are separate checks.
- Secrets never use `NEXT_PUBLIC_` variables.
- Logs exclude message bodies, credentials, and connection strings.
- Audit logs record safe identifiers and actions rather than sensitive payloads.
- Demo reset is role-restricted and requires confirmation.

## 12. Verification

### 12.1 Automated checks

- Lint and TypeScript checks pass.
- Unit tests cover mock-adapter outcomes, authorization, validation, idempotency, and state transitions.
- Integration tests cover repository scoping, transactional audit writes, assignments, tags, notes, unread state, and retry behavior.
- Migration tests apply the schema to an empty Neon-compatible database.
- Browser tests cover sign-in, account filtering, conversation search, thread opening, mock sending, refresh persistence, assignment, tags, notes, unread state, mobile navigation, and permission denial.

### 12.2 Staging acceptance criteria

- The staging URL authenticates through branch-specific Neon Auth.
- Messenger and Instagram mock accounts appear in a unified queue.
- Every visible conversation belongs to the authenticated workspace.
- A mock outbound message survives refresh and follows the configured delivery path.
- Failed fixtures retry without duplicate messages.
- Assignment, tags, internal notes, and unread state survive refresh.
- The Demo indicator is always visible near sending controls.
- No network request targets Meta, Instagram, Facebook, Messenger, Viber, WhatsApp, or another messaging provider.
- The current Vercel project uses only PhilInspectCRM's Neon `staging` branch.
- The Neon primary branch and any future production Vercel project remain untouched.

## 13. Future Live Meta Phase

The later live phase will require a verified legal business, a verified Meta Business Portfolio, App Review, Advanced Access, privacy and data-deletion URLs, OAuth callbacks, webhook verification, encrypted token storage, and a production adapter.

That work is not implied by this POC. It requires a new design approval and explicit authorization before connecting or sending through any real account.
