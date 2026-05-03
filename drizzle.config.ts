import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "ef22a166-d951-41c1-8317-3195dbd37048",
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
