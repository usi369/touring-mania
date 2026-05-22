import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const PROJECT_ROOT = process.cwd();
const plugins = [
  react(),
  tailwindcss()
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(PROJECT_ROOT, "client/src"),
      "@shared": path.resolve(PROJECT_ROOT, "shared"),
      "@assets": path.resolve(PROJECT_ROOT, "attached_assets"),
    },
  },
  envDir: PROJECT_ROOT,
  root: path.resolve(PROJECT_ROOT, "client"),
  publicDir: "public",
  build: {
    outDir: path.resolve(PROJECT_ROOT, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5180,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
    allowedHosts: [
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
