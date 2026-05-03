import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../appRouter";
import { createContext } from "./context";
import { handleOAuthCallback } from "./oauth";
import { initEnv } from "./env";
import { initDb } from "../db";

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);

    // Initialize Environment Variables
    initEnv(env);

    // Initialize DB with D1 binding from environment
    if (env.DB) {
      await initDb(env.DB);
    }

    // Handle OAuth callback
    if (url.pathname === "/api/oauth/callback") {
      return handleOAuthCallback(request);
    }

    // Handle tRPC API requests
    if (url.pathname.startsWith("/api/trpc")) {
      return fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: (opts) => createContext(opts, env),
        responseMeta: ({ ctx }) => {
          if (ctx?.resHeaders) {
            return {
              headers: Object.fromEntries(ctx.resHeaders.entries()),
            };
          }
          return {};
        },
      });
    }

    // Health check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fallback to static assets (Cloudflare Pages)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
