import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

export async function handleOAuthCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response(JSON.stringify({ error: "code and state are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return new Response(JSON.stringify({ error: "openId missing from user info" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    
    // Construct Set-Cookie header manually or using a library
    // For simplicity, we construct it manually here
    let cookie = `${COOKIE_NAME}=${sessionToken}; Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}; Path=${cookieOptions.path || "/"}`;
    if (cookieOptions.httpOnly) cookie += "; HttpOnly";
    if (cookieOptions.secure) cookie += "; Secure";
    if (cookieOptions.sameSite) {
      const sameSite = cookieOptions.sameSite.charAt(0).toUpperCase() + cookieOptions.sameSite.slice(1);
      cookie += `; SameSite=${sameSite}`;
    }

    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/",
        "Set-Cookie": cookie,
      },
    });
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return new Response(JSON.stringify({ error: "OAuth callback failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
