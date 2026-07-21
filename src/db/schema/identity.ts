import {
  index,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const roleNameEnum = pgEnum("role_name", [
  "account_manager",
  "sales",
  "admin",
]);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    neonAuthOrganizationId: varchar("neon_auth_organization_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("workspaces_neon_auth_org_idx").on(table.neonAuthOrganizationId),
  ],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: varchar("auth_user_id", { length: 255 }),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_auth_user_idx").on(table.authUserId),
    index("users_workspace_idx").on(table.workspaceId),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: roleNameEnum("name").notNull(),
    label: varchar("label", { length: 80 }).notNull(),
  },
  (table) => [uniqueIndex("roles_name_idx").on(table.name)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })],
);

export const demoSessions = pgTable("demo_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  activeUserId: uuid("active_user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
