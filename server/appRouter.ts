import { COOKIE_NAME } from "@shared/const";
// Force server reload - update timestamp: 2026-04-27T07:54:00Z
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { gameRouter } from "./routers/game";
import { cpuTurnRouter } from "./routers/cpuTurn";
import { guestRouter } from "./routers/guest";
import { getDb } from "./db";
import { likes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      let cookie = `${COOKIE_NAME}=; Max-Age=-1; Path=${cookieOptions.path || "/"}`;
      if (cookieOptions.httpOnly) cookie += "; HttpOnly";
      if (cookieOptions.secure) cookie += "; Secure";
      if (cookieOptions.sameSite) {
        const sameSite = cookieOptions.sameSite.charAt(0).toUpperCase() + cookieOptions.sameSite.slice(1);
        cookie += `; SameSite=${sameSite}`;
      }
      ctx.resHeaders.set("Set-Cookie", cookie);
      return {
        success: true,
      } as const;
    }),
  }),
  game: gameRouter,
  cpuTurn: cpuTurnRouter,
  guest: guestRouter,
  bike: router({
    list: publicProcedure.query(async () => {
      const { listBikesWithAutoSeed } = await import('./db');
      return await listBikesWithAutoSeed();
    }),
  }),
  social: router({
    getLikes: publicProcedure.query(async () => {
      const db = await getDb();
      const result = await db.select().from(likes).limit(1);
      if (result.length === 0) {
        try {
          await db.insert(likes).values({ count: 0 });
          return 0;
        } catch (e) {
          return 0;
        }
      }
      return result[0].count;
    }),
    incrementLike: publicProcedure.mutation(async () => {
      const db = await getDb();
      const result = await db.select().from(likes).limit(1);
      
      if (result.length === 0) {
        await db.insert(likes).values({ count: 1 });
        return 1;
      }
      
      const record = result[0];
      const newCount = record.count + 1;
      await db.update(likes).set({ 
        count: newCount, 
        updatedAt: new Date() 
      }).where(eq(likes.id, record.id));
      
      return newCount;
    }),
  }),
});

export type AppRouter = typeof appRouter;
