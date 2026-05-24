import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/" } =
    options ?? {};
  const utils = trpc.useUtils();
  
  // Local state for token to trigger reactivity when logging in/out
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("touring-mania-jwt");
    }
    return null;
  });

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: Boolean(token),
  });

  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("touring-mania-jwt");
      localStorage.removeItem("manus-runtime-user-info");
      setToken(null);
      utils.auth.me.setData(undefined, undefined);
      await utils.auth.me.invalidate();
    }
  }, [utils, logoutMutation]);

  const login = useCallback(async (jwtToken: string, user: any) => {
    localStorage.setItem("touring-mania-jwt", jwtToken);
    localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    setToken(jwtToken);
    utils.auth.me.setData(undefined, user);
    await utils.auth.me.refetch();
  }, [utils]);

  const state = useMemo(() => {
    const dbUser = token ? meQuery.data : null;
    if (dbUser) {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify(dbUser)
      );
    }
    console.log("[useAuth DEBUG] state updated", {
      hasToken: Boolean(token),
      dbUser: dbUser ? { id: dbUser.id, email: dbUser.email, name: dbUser.name } : null,
      meQuery: {
        data: meQuery.data,
        isLoading: meQuery.isLoading,
        error: meQuery.error ? String(meQuery.error) : null,
      }
    });
    return {
      user: dbUser ?? null,
      loading: meQuery.isLoading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(token && dbUser),
    };
  }, [
    token,
    meQuery.data,
    meQuery.isLoading,
    meQuery.error,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    isLoaded: !meQuery.isLoading,
    refresh: () => meQuery.refetch(),
    logout,
    login,
  };
}
