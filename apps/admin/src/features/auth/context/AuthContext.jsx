import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getCurrentUser,
  getOwnAdminProfile,
  signInWithPassword,
  signOutCurrentSession,
  subscribeToAuthChanges,
} from "../api/authApi.js";
import { queryClient } from "../../../lib/queryClient.js";
import { supabaseConfigurationError } from "../../../lib/supabaseClient.js";
import { AuthContext } from "./authContext.js";

const recognizedRoles = new Set(["owner", "admin", "editor"]);

function signedOutState() {
  return { status: "signed_out", user: null, admin: null, error: null };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => supabaseConfigurationError
    ? { status: "error", user: null, admin: null, error: supabaseConfigurationError }
    : { status: "initializing", user: null, admin: null, error: null });
  const authorizationRun = useRef(0);
  const authorizedIdentity = useRef(null);

  const authorizeUser = useCallback(async (user) => {
    const run = ++authorizationRun.current;
    if (authorizedIdentity.current !== (user?.id || null)) queryClient.clear();
    authorizedIdentity.current = user?.id || null;

    if (!user) {
      setAuthState(signedOutState());
      return;
    }

    setAuthState({ status: "checking_authorization", user, admin: null, error: null });

    try {
      const admin = await getOwnAdminProfile(user.id);
      // Auth events can overlap slow profile requests. Ignore stale completions so
      // an earlier identity cannot overwrite the latest session's authorization.
      if (run !== authorizationRun.current) return;

      // This client gate controls presentation only. RLS and database grants are
      // the security boundary when an authenticated caller bypasses the UI.
      if (!admin || !admin.is_active || !recognizedRoles.has(admin.role)) queryClient.clear();
      if (!admin) {
        setAuthState({ status: "unauthorized", user, admin: null, error: null });
      } else if (!admin.is_active) {
        setAuthState({ status: "inactive", user, admin, error: null });
      } else if (!recognizedRoles.has(admin.role)) {
        setAuthState({ status: "unauthorized", user, admin: null, error: null });
      } else {
        setAuthState({ status: "authorized", user, admin, error: null });
      }
    } catch {
      if (run !== authorizationRun.current) return;
      setAuthState({
        status: "error",
        user,
        admin: null,
        error: "Nuede could not verify administrative access. Check the connection and try again.",
      });
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      await authorizeUser(await getCurrentUser());
    } catch {
      setAuthState({
        status: "error",
        user: null,
        admin: null,
        error: "Nuede could not initialize the admin session. Check the connection and try again.",
      });
    }
  }, [authorizeUser]);

  useEffect(() => {
    if (supabaseConfigurationError) {
      return undefined;
    }

    let active = true;
    const unsubscribe = subscribeToAuthChanges((event, session) => {
      if (!active || event === "INITIAL_SESSION") return;

      queueMicrotask(() => {
        if (!active) return;
        if (event === "SIGNED_OUT" || !session?.user) {
          authorizationRun.current += 1;
          // Cached admin data must not survive into a later identity's session.
          queryClient.clear();
          setAuthState(signedOutState());
        } else if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
          void authorizeUser(session.user);
        }
      });
    });

    queueMicrotask(() => {
      if (active) void initialize();
    });

    return () => {
      active = false;
      authorizationRun.current += 1;
      unsubscribe();
    };
  }, [authorizeUser, initialize]);

  const retry = useCallback(async () => {
    setAuthState((current) => ({ ...current, status: "initializing", error: null }));
    await initialize();
  }, [initialize]);

  const signIn = useCallback(async (credentials) => {
    const user = await signInWithPassword(credentials);
    await authorizeUser(user);
  }, [authorizeUser]);

  const signOut = useCallback(async () => {
    await signOutCurrentSession();
    authorizationRun.current += 1;
    queryClient.clear();
    setAuthState(signedOutState());
  }, []);

  const value = useMemo(() => ({
    ...authState,
    retry,
    signIn,
    signOut,
  }), [authState, retry, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
