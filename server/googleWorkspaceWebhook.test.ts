import { describe, expect, it } from "vitest";

describe("Google Workspace webhook configuration", () => {
  it("responds to a lightweight validation request", async () => {
    const webhookUrl = process.env.GOOGLE_WORKSPACE_WEBHOOK_URL;
    expect(webhookUrl).toMatch(/^https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec$/);

    const response = await fetch(webhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(true);
    const payload = await response.json() as { ok?: boolean; error?: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toBe("Missing required fields");
  }, 30_000);
});
