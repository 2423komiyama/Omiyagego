import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { createRemoteJWKSet, jwtVerify } from "jose";
import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);
const STATE_COOKIE = "omiyage_oauth_state";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getOrigin(req: Request): string {
  const proto =
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ||
    req.protocol;
  return `${proto}://${req.get("host")}`;
}

function getRedirectUri(req: Request): string {
  return `${getOrigin(req)}/api/oauth/callback`;
}

async function establishSession(
  req: Request,
  res: Response,
  profile: { openId: string; name: string | null; email: string | null }
) {
  await db.upsertUser({
    openId: profile.openId,
    name: profile.name,
    email: profile.email,
    loginMethod: "google",
    lastSignedIn: new Date(),
  });

  // 初回ログインボーナス付与（1回のみ）
  try {
    const dbUser = await db.getUserByOpenId(profile.openId);
    if (dbUser) {
      await db.processLoginBonus(dbUser.id);
    }
  } catch (bonusErr) {
    console.warn("[OAuth] Login bonus failed (non-critical):", bonusErr);
  }

  const sessionToken = await sdk.createSessionToken(profile.openId, {
    name: profile.name || "",
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: ONE_YEAR_MS,
  });
}

export function registerOAuthRoutes(app: Express) {
  // ログイン開始: Googleの同意画面へリダイレクト
  app.get("/api/oauth/google", async (req: Request, res: Response) => {
    // Google未設定の開発環境ではdevユーザーで即ログイン
    if (!ENV.googleClientId) {
      if (ENV.isProduction) {
        res
          .status(500)
          .json({ error: "GOOGLE_CLIENT_ID is not configured" });
        return;
      }
      await establishSession(req, res, {
        openId: "dev:local-user",
        name: "開発ユーザー",
        email: "dev@example.com",
      });
      res.redirect(302, "/");
      return;
    }

    const state = crypto.randomBytes(16).toString("hex");
    res.cookie(STATE_COOKIE, state, {
      ...getSessionCookieOptions(req),
      maxAge: 10 * 60 * 1000,
    });

    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", getRedirectUri(req));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    res.redirect(302, url.toString());
  });

  // Googleからのコールバック
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const cookieState = req.cookies?.[STATE_COOKIE] ??
      // cookie-parser未使用のため手動パース
      (req.headers.cookie || "")
        .split(";")
        .map(c => c.trim().split("="))
        .find(([k]) => k === STATE_COOKIE)?.[1];

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    if (!cookieState || cookieState !== state) {
      res.status(400).json({ error: "state mismatch" });
      return;
    }

    try {
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: getRedirectUri(req),
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) {
        const detail = await tokenRes.text().catch(() => tokenRes.statusText);
        throw new Error(`Token exchange failed: ${tokenRes.status} ${detail}`);
      }
      const tokenJson = (await tokenRes.json()) as { id_token?: string };
      if (!tokenJson.id_token) {
        throw new Error("id_token missing from token response");
      }

      const { payload } = await jwtVerify(tokenJson.id_token, GOOGLE_JWKS, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: ENV.googleClientId,
      });

      const sub = payload.sub;
      if (!sub) {
        res.status(400).json({ error: "sub missing from id_token" });
        return;
      }

      await establishSession(req, res, {
        openId: `google:${sub}`,
        name: typeof payload.name === "string" ? payload.name : null,
        email: typeof payload.email === "string" ? payload.email : null,
      });

      res.clearCookie(STATE_COOKIE, getSessionCookieOptions(req));
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
