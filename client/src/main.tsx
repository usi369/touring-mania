import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { ToastProvider } from "./components/Toast";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Clear invalid token and user info
  localStorage.removeItem("touring-mania-jwt");
  localStorage.removeItem("manus-runtime-user-info");

  window.location.href = "/";
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async fetch(input, init) {
        const headers = new Headers(init?.headers);
        let tokenSet = false;
        if (typeof window !== "undefined") {
          try {
            const token = localStorage.getItem("touring-mania-jwt");
            console.log("[main.tsx DEBUG] Custom JWT token retrieved from localStorage:", token ? `${token.substring(0, 15)}...` : "null");
            if (token) {
              headers.set("Authorization", `Bearer ${token}`);
              tokenSet = true;
            }
          } catch (e) {
            console.error("[main.tsx ERROR] Failed to fetch custom JWT token from localStorage", e);
          }
        }
        console.log("[main.tsx DEBUG] tRPC fetch request headers:", {
          url: String(input),
          tokenSet,
        });
        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
