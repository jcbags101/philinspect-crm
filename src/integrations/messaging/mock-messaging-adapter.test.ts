import { describe, expect, it } from "vitest";

import { MockMessagingAdapter } from "./mock-messaging-adapter";
import type { SendMessageInput } from "./types";

const baseInput: SendMessageInput = {
  messageId: "00000000-0000-4000-8000-000000000001",
  accountExternalId: "fixture-messenger-northstar",
  providerConversationId: "fixture-messenger-conversation-001",
  body: "Fictional message",
  attemptNumber: 1,
  scenario: "success",
};

describe("MockMessagingAdapter", () => {
  it("returns identical outcomes for identical input", async () => {
    const adapter = new MockMessagingAdapter();
    await expect(adapter.send(baseInput)).resolves.toEqual(await adapter.send(baseInput));
  });

  it("fails once and succeeds on retry", async () => {
    const adapter = new MockMessagingAdapter();
    const first = await adapter.send({ ...baseInput, scenario: "fail_once" });
    const retry = await adapter.send({ ...baseInput, scenario: "fail_once", attemptNumber: 2 });
    expect(first.state).toBe("failed");
    expect(retry.state).toBe("read");
  });

  it("never requires a real account to report fixture health", async () => {
    const adapter = new MockMessagingAdapter();
    await expect(adapter.getAccountHealth("fixture-instagram-launchpad")).resolves.toMatchObject({ status: "warning" });
  });
});
