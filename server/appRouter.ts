import { COOKIE_NAME } from "@shared/const";
// Force server reload - update timestamp: 2026-05-07T22:45:00Z
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { gameRouter } from "./routers/game";
import { guestRouter } from "./routers/guest";
import { authRouter } from "./routers/auth";
import { getDb } from "./db";
import { likes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
  game: gameRouter,
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
