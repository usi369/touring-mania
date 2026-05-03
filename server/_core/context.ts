import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { validateGuestSession } from "../guestSession";
import { parse as parseCookie } from "cookie";

export type TrpcContext = {
  req: Request;
  env: any;
  user: User | null;
  guestSessionId?: string;
  resHeaders: Headers;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
  env: any
): Promise<TrpcContext> {
  const resHeaders = new Headers();
  let user: User | null = null;
  let guestSessionId: string | undefined = undefined;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Check for guest session
  const cookieHeader = opts.req.headers.get("cookie");
  const cookies = cookieHeader ? parseCookie(cookieHeader) : {};
  const guestSessionCookie = cookies.guestSessionId;
  
  if (guestSessionCookie && validateGuestSession(guestSessionCookie)) {
    guestSessionId = guestSessionCookie;
  }

  return {
    req: opts.req,
    env,
    user,
    guestSessionId,
    resHeaders,
  };
}
