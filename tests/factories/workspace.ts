let workspaceSequence = 0;

export interface WorkspaceFixture {
  id: string;
  name: string;
  neonAuthOrganizationId: string;
}

export function workspaceFixture(
  overrides: Partial<WorkspaceFixture> = {},
): WorkspaceFixture {
  workspaceSequence += 1;
  return {
    id: `00000000-0000-4000-8000-${workspaceSequence.toString().padStart(12, "0")}`,
    name: `Workspace ${workspaceSequence}`,
    neonAuthOrganizationId: `test-organization-${workspaceSequence}`,
    ...overrides,
  };
}
