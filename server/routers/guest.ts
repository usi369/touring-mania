import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createGuestSession } from "../guestSession";

export const guestRouter = router({
  /**
   * Create a new guest session
   */
  createSession: publicProcedure.mutation(async ({ ctx }) => {
    try {
      const sessionId = createGuestSession();

      // Set guest session cookie in response headers
      const secure = ctx.req.url.startsWith("https");
      let cookie = `guestSessionId=${sessionId}; Max-Age=${30 * 60}; Path=/; SameSite=Lax`;
      if (secure) cookie += "; Secure";
      
      ctx.resHeaders.set("Set-Cookie", cookie);

      return { sessionId };
    } catch (error) {
      console.error("Error creating guest session:", error);
      throw error;
    }
  }),
});
