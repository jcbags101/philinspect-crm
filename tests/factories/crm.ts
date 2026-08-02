let crmSequence = 0;

function nextId(prefix: string): string {
  crmSequence += 1;
  return `${prefix}-${crmSequence.toString().padStart(4, "0")}`;
}

export function companyFixture(overrides: Record<string, unknown> = {}) {
  const sequence = crmSequence + 1;
  return {
    id: nextId("company"),
    name: `Company ${sequence}`,
    industry: "Property services",
    website: `https://company-${sequence}.example.test`,
    ...overrides,
  };
}

export function contactFixture(overrides: Record<string, unknown> = {}) {
  const sequence = crmSequence + 1;
  return {
    id: nextId("contact"),
    firstName: "Test",
    lastName: `Contact ${sequence}`,
    email: `contact-${sequence}@example.test`,
    phone: "+63 900 000 0000",
    ...overrides,
  };
}

export function leadFixture(overrides: Record<string, unknown> = {}) {
  const sequence = crmSequence + 1;
  return {
    id: nextId("lead"),
    name: `Lead ${sequence}`,
    companyName: `Prospect ${sequence}`,
    email: `lead-${sequence}@example.test`,
    segment: "sme_going_digital",
    status: "new",
    ...overrides,
  };
}

export function dealFixture(overrides: Record<string, unknown> = {}) {
  const sequence = crmSequence + 1;
  return {
    id: nextId("deal"),
    title: `Inspection opportunity ${sequence}`,
    stage: "lead",
    kind: "service",
    value: "125000.00",
    currency: "PHP",
    ...overrides,
  };
}

export function taskFixture(overrides: Record<string, unknown> = {}) {
  const sequence = crmSequence + 1;
  return {
    id: nextId("task"),
    title: `Follow up ${sequence}`,
    status: "open",
    priority: "medium",
    dueAt: new Date("2026-08-15T09:00:00.000Z"),
    ...overrides,
  };
}
