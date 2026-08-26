import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState, encodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

const APPROVED_PUBLIC_ORIGIN = "https://santosoka-dqvkmaei.manus.space";
const APPROVED_PUBLIC_HOSTS = new Set([
  "santosoka-dqvkmaei.manus.space",
  "santossokaacademy.co.ke",
  "www.santossokaacademy.co.ke",
]);
const DEFAULT_ADMIN_RETURN_PATH = "/manage-senior-players.html";

export function getSessionDisplayName(userInfo: { name?: string | null; email?: string | null; openId: string }): string {
  return userInfo.name?.trim() || userInfo.email?.trim() || userInfo.openId;
}

function getSafeReturnPath(req: Request): string {
  const candidate = getQueryParam(req, "returnTo");
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return DEFAULT_ADMIN_RETURN_PATH;
  }
  return candidate;
}

export function getPublicOrigin(req: Request): string {
  const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = forwardedHost || req.get("host") || "";
  const hostname = requestHost.replace(/:\d+$/, "").toLowerCase();
  const requestProtocol = (req.get("x-forwarded-proto") || req.protocol).split(",")[0].trim();

  // OAuth redirect URIs are allowlisted by the Manus application. Internal
  // Cloud Run hosts, preview hosts, and localhost must never be sent to OAuth.
  if (!APPROVED_PUBLIC_HOSTS.has(hostname)) return APPROVED_PUBLIC_ORIGIN;

  const protocol = hostname.endsWith("manus.space") ? "https" : requestProtocol || "https";
  return `${protocol}://${requestHost}`;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", (req: Request, res: Response) => {
    if (!ENV.oauthPortalUrl || !ENV.appId) {
      res.status(500).json({ error: "OAuth is not configured" });
      return;
    }

    const nonce = crypto.randomUUID();
    const redirectUri = `${getPublicOrigin(req)}/api/oauth/callback`;
    const returnTo = getSafeReturnPath(req);
    const state = encodeOAuthState({ redirectUri, nonce, returnTo });
    res.cookie(OAUTH_STATE_COOKIE, nonce, { path: "/", maxAge: 600_000, sameSite: "none", secure: true });

    const url = new URL(`${ENV.oauthPortalUrl.replace(/\/$/, "")}/app-auth`);
    url.searchParams.set("appId", ENV.appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    res.redirect(302, url.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const oauthState = decodeOAuthState(state);
    const { nonce } = oauthState;
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: getSessionDisplayName(userInfo),
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, oauthState.returnTo || DEFAULT_ADMIN_RETURN_PATH);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
