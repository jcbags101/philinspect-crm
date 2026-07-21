export type MessagingChannel = "messenger" | "instagram";
export type DeliveryState = "queued" | "sent" | "delivered" | "read" | "failed";
export type MockScenario = "success" | "delivered_only" | "fail_once" | "auto_reply";

export interface MessagingAccountHealth {
  status: "connected" | "warning" | "disconnected";
  warning: string | null;
}

export interface SendMessageInput {
  messageId: string;
  accountExternalId: string;
  providerConversationId: string;
  body: string;
  attemptNumber: number;
  scenario: MockScenario;
}

export interface SendMessageOutcome {
  state: Exclude<DeliveryState, "queued">;
  providerMessageId: string | null;
  safeError: string | null;
  inboundResponse: { body: string; providerMessageId: string } | null;
}

export interface MessagingAdapter {
  getAccountHealth(accountExternalId: string): Promise<MessagingAccountHealth>;
  send(input: SendMessageInput): Promise<SendMessageOutcome>;
}
