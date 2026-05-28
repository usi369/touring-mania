import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { ENV } from "../_core/env";
import { generateToken } from "../_core/sdk";

export const authRouter = router({
  /**
   * Initiate authentication by generating a 6-character alphanumeric code
   */
  sendOtp: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const email = input.email.toLowerCase().trim();
      // Generate 6-character random alphanumeric code (uppercase)
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 minutes

      try {
        await db.createOtp(email, code, expiresAt);
        console.log(`[AUTH] Initiated authentication for ${email}. Code: ${code}`);

        return {
          success: true,
          code,
          to: "login@nirin-hub.me",
        };
      } catch (error) {
        console.error("Error in sendOtp:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "認証コードの生成に失敗しました",
        });
      }
    }),

  /**
   * Poll authentication status to check if the email routing worker has verified it
   */
  pollAuthStatus: publicProcedure
    .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
    .query(async ({ input, ctx }) => {
      const email = input.email.toLowerCase().trim();
      const code = input.code.toUpperCase().trim();

      try {
        const otp = await db.getLatestOtp(email);

        if (!otp) {
          return {
            verified: false,
            status: "not_found" as const,
          };
        }

        // Expiry check
        if (new Date() > new Date(otp.expiresAt)) {
          await db.deleteOtp(email);
          return {
            verified: false,
            status: "expired" as const,
          };
        }

        // Code match check
        if (otp.code !== code) {
          return {
            verified: false,
            status: "invalid_code" as const,
          };
        }

        // Check if verified by email worker
        if (otp.status === "verified") {
          // Clear OTP on success
          await db.deleteOtp(email);

          // Fetch or auto-provision user
          let user = await db.getUserByEmail(email);
          let isNewUser = false;

          if (!user) {
            console.log(`[AUTH] Registering new user for email: ${email}`);
            const defaultName = email.split("@")[0] || "User";
            isNewUser = true;
            
            await db.upsertUser({
              openId: email,
              email: email,
              name: defaultName,
              loginMethod: "email_otp",
              lastSignedIn: new Date(),
            });

            user = await db.getUserByEmail(email);
          }

          if (!user) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "ユーザーの作成に失敗しました",
            });
          }

          // 愛車設定の有無をチェック
          const garageRecord = await db.getUserGarage(user.id);
          const hasGarageBike = !!garageRecord;

          // Generate custom JWT token
          const token = await generateToken({
            userId: user.id,
            email: user.email || "",
          });

          // Set secure Session Cookie
          const secure = ctx.req.url.startsWith("https");
          let cookie = `__session=${token}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
          if (secure) cookie += "; Secure";

          ctx.resHeaders.set("Set-Cookie", cookie);

          return {
            verified: true,
            status: "success" as const,
            token,
            user,
            isNewUser,
            hasGarageBike,
          };
        }

        // Still pending
        return {
          verified: false,
          status: "pending" as const,
        };
      } catch (error) {
        console.error("Error in pollAuthStatus:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "認証状態の確認中にエラーが発生しました",
        });
      }
    }),

  /**
   * Get the currently logged-in user info
   */
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  /**
   * Logout user by clearing the session cookie
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    const secure = ctx.req.url.startsWith("https");
    let cookie = `__session=; Max-Age=-1; Path=/; SameSite=Lax`;
    if (secure) cookie += "; Secure";
    ctx.resHeaders.set("Set-Cookie", cookie);

    return {
      success: true,
    };
  }),
});
