import type {
  MessagingAdapter,
  MessagingAccountHealth,
  SendMessageInput,
  SendMessageOutcome,
} from "./types";

function stableSuffix(value: string): string {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash.toString(36).padStart(6, "0").slice(-6);
}

export class MockMessagingAdapter implements MessagingAdapter {
  async getAccountHealth(accountExternalId: string): Promise<MessagingAccountHealth> {
    const warning = accountExternalId.includes("launchpad")
      ? "Simulated sync delay · retry is safe"
      : null;
    return { status: warning ? "warning" : "connected", warning };
  }

  async send(input: SendMessageInput): Promise<SendMessageOutcome> {
    if (input.scenario === "fail_once" && input.attemptNumber === 1) {
      return {
        state: "failed",
        providerMessageId: null,
        safeError: "Simulated temporary delivery failure",
        inboundResponse: null,
      };
    }

    const suffix = stableSuffix(`${input.messageId}:${input.attemptNumber}`);
    const state = input.scenario === "delivered_only" ? "delivered" : "read";
    const shouldReply = input.scenario === "auto_reply" || input.providerConversationId.endsWith("001");
    return {
      state,
      providerMessageId: `mock-provider-${suffix}`,
      safeError: null,
      inboundResponse: shouldReply
        ? {
            body: "Thanks! This is a deterministic fictional auto-reply for the demo.",
            providerMessageId: `mock-reply-${suffix}`,
          }
        : null,
    };
  }
}
