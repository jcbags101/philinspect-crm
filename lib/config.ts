type AppConfig = { name: string; client: string; version: string; modules: string[]; roles: string[]; adminEmail: string };

export function getAppConfig(): AppConfig {
  let input: Partial<AppConfig> = {};
  try { input = JSON.parse(process.env.APP_CONFIG || "{}") as Partial<AppConfig>; } catch {}
  return {
    name: process.env.APP_NAME || input.name || "CRM Core",
    client: input.client || "",
    version: input.version || "0.1.0",
    modules: input.modules || ["contacts", "companies", "leads", "pipeline", "tasks", "audit"],
    roles: input.roles || ["Administrator", "Manager", "Sales agent"],
    adminEmail: input.adminEmail || "",
  };
}
