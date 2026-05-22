import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import * as jose from "jose";

const getSecret = () => {
  return new TextEncoder().encode(ENV.cookieSecret || "touring_mania_default_jwt_secret_key_for_development");
};

export async function generateToken(payload: { userId: number; email: string }): Promise<string> {
  const secret = getSecret();
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyJwtToken(token: string): Promise<{ userId: number; email: string }> {
  const secret = getSecret();
  const { payload } = await jose.jwtVerify(token, secret);
  return payload as { userId: number; email: string };
}

class SDKServer {
  private parseCookies(cookieHeader: string | null | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  async authenticateRequest(req: Request): Promise<User> {
    // 1. Extract JWT token from Authorization header or Cookie
    const authHeader = req.headers.get("Authorization");
    let token: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieHeader = req.headers.get("cookie");
      const cookies = this.parseCookies(cookieHeader);
      token = cookies.get("__session") || null;
    }

    console.log("[sdk.ts DEBUG] authenticateRequest", {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      authHeaderExists: !!authHeader,
    });

    if (!token) {
      throw ForbiddenError("No token provided");
    }

    // 2. Verify JWT Token
    let userId: number;
    try {
      console.log("[sdk.ts DEBUG] Verifying custom JWT token...");
      const verified = await verifyJwtToken(token);
      console.log("[sdk.ts DEBUG] Token verified successfully, userId:", verified.userId);
      userId = verified.userId;
    } catch (e) {
      console.error("[sdk.ts ERROR] JWT token verification failed:", e);
      throw ForbiddenError("Invalid token");
    }

    const signedInAt = new Date();
    let user = await db.getUserById(userId);

    if (!user) {
      console.error("[sdk.ts ERROR] User not found in database for ID:", userId);
      throw ForbiddenError("User not found");
    } else {
      // Update lastSignedIn for existing user
      console.log("[sdk.ts DEBUG] Updating lastSignedIn for existing user:", user.id);
      await db.upsertUser({
        openId: user.openId,
        name: user.name,
        email: user.email,
        lastSignedIn: signedInAt,
      });

      const updatedUser = await db.getUserById(userId);
      if (updatedUser) {
        user = updatedUser;
      }
    }

    return user;
  }
}

export const sdk = new SDKServer();
