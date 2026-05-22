import { describe, expect, it } from "vitest";
import { appRouter } from "./appRouter";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const req = new Request("https://example.com/api/auth/logout");

  const ctx: TrpcContext = {
    user,
    req,
    env: {},
    resHeaders: new Headers(),
  };

  return { ctx };
}

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    
    const setCookie = ctx.resHeaders.get("Set-Cookie");
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("__session=;");
    expect(setCookie).toContain("Max-Age=-1");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");
  });
});
