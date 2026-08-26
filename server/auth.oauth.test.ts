import { describe, expect, it } from "vitest";
import { decodeOAuthState, encodeOAuthState } from "@shared/const";
import { getPublicOrigin, getSessionDisplayName } from "./_core/oauth";

describe("OAuth session handling", () => {
  it("uses a stable fallback when the provider omits a display name", () => {
    expect(getSessionDisplayName({ name: "", email: "player@example.com", openId: "user-123" })).toBe("player@example.com");
    expect(getSessionDisplayName({ name: null, email: null, openId: "user-123" })).toBe("user-123");
    expect(getSessionDisplayName({ name: "  Santos Admin  ", email: "admin@example.com", openId: "admin-123" })).toBe("Santos Admin");
  });

  it("uses only approved origins for OAuth redirects", () => {
    const request = (headers: Record<string, string>, host: string, protocol = "http") => ({
      protocol,
      get: (key: string) => headers[key] ?? (key === "host" ? host : undefined),
    }) as never;

    expect(getPublicOrigin(request({}, "j3g7xox4z4-kzukdcmpfa-uk.a.run.app", "https"))).toBe("https://santosoka-dqvkmaei.manus.space");
    expect(getPublicOrigin(request({}, "3000-preview.manus.computer", "http"))).toBe("https://santosoka-dqvkmaei.manus.space");
    expect(getPublicOrigin(request({}, "santosoka-dqvkmaei.manus.space", "https"))).toBe("https://santosoka-dqvkmaei.manus.space");
    expect(getPublicOrigin(request({}, "santossokaacademy.co.ke", "https"))).toBe("https://santossokaacademy.co.ke");
  });

  it("round-trips the post-login return path in OAuth state", () => {
    const state = encodeOAuthState({
      redirectUri: "https://santosoka-dqvkmaei.manus.space/api/oauth/callback",
      nonce: "nonce-123",
      returnTo: "/manage-senior-players.html",
    });

    expect(decodeOAuthState(state)).toEqual({
      redirectUri: "https://santosoka-dqvkmaei.manus.space/api/oauth/callback",
      nonce: "nonce-123",
      returnTo: "/manage-senior-players.html",
    });
  });
});
