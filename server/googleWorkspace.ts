import { ENV } from "./_core/env";

type TrialRegistration = {
  player: string;
  dob: string;
  category: string;
  parent: string;
  phone: string;
  email?: string;
  message?: string;
};

type WebhookResponse = {
  ok?: boolean;
  error?: string;
};

export async function forwardTrialRegistrationToGoogleWorkspace(
  input: TrialRegistration,
): Promise<boolean> {
  const webhookUrl = ENV.googleWorkspaceWebhookUrl;
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...input,
        ...(ENV.googleWorkspaceWebhookSecret
          ? { secret: ENV.googleWorkspaceWebhookSecret }
          : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(`[Google Workspace] Webhook returned HTTP ${response.status}`);
      return false;
    }

    const result = (await response.json()) as WebhookResponse;
    if (result.ok !== true) {
      console.warn("[Google Workspace] Webhook rejected the registration");
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Google Workspace] Webhook delivery failed", error);
    return false;
  }
}
