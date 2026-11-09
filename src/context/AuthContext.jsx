// Trade Journal Authentication Context.
// Provides Supabase Authentication state and methods to the whole application.
// Single-user access: only an authorized user can open protected pages.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  supabase,
  isSupabaseConfigured,
} from "../lib/supabaseClient.js";
import { toUserError } from "../lib/errors.js";

const AuthContext = createContext(null);

// Optional allow-list for a single authorized account.
// Set VITE_AUTHORIZED_USER_ID to a Supabase auth.users id to restrict access
// to exactly one account. When unset, any authenticated user may sign in.
const AUTHORIZED_USER_ID =
  typeof import.meta.env.VITE_AUTHORIZED_USER_ID === "string"
    ? import.meta.env.VITE_AUTHORIZED_USER_ID.trim()
    : "";

function isAuthorized(user) {
  if (!AUTHORIZED_USER_ID) return true;
  return Boolean(user && user.id === AUTHORIZED_USER_ID);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  const signIn = useCallback(async (email, password) => {
    setInitError(null);
    if (!supabase) {
      const err = new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      setInitError(err.message);
      throw err;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || ""),
    });

    if (error) {
      const message = toUserError(error, "Invalid email or password. Please try again.");
      setInitError(message);
      throw new Error(message);
    }

    if (!data.user) {
      const message = "Sign-in failed. No user returned.";
      setInitError(message);
      throw new Error(message);
    }

    if (!isAuthorized(data.user)) {
      // Sign out the unauthorized account so it cannot linger in the session.
      await supabase.auth.signOut();
      const message =
        AUTHORIZED_USER_ID
          ? "This account is not authorized to use this Trade Journal."
          : "Sign-in was rejected. Please contact the administrator.";
      setInitError(message);
      throw new Error(message);
    }

    return data;
  }, []);

  const signOut = useCallback(async () => {
    setInitError(null);
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      const message = toUserError(err, "Failed to sign out. Please try again.");
      setInitError(message);
      throw new Error(message);
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    setInitError(null);
    if (!supabase) {
      const err = new Error("Supabase is not configured.");
      setInitError(err.message);
      throw err;
    }

    // Always render a neutral confirmation so we do not reveal whether an
    // email address is registered.
    const { error } = await supabase.auth.resetPasswordForEmail(String(email || "").trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      // Do not surface whether the email exists. Return a neutral message.
      const message = "If an account exists for this email, a password reset link has been sent.";
      setInitError(message);
      throw new Error(message);
    }

    // Always neutral: do not reveal whether the email is registered.
    return { sent: true };
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    setInitError(null);
    if (!supabase) {
      const err = new Error("Supabase is not configured.");
      setInitError(err.message);
      throw err;
    }

    const { error } = await supabase.auth.updateUser({ password: String(newPassword || "") });

    if (error) {
      const message = toUserError(error, "Failed to update password. Please try again.");
      setInitError(message);
      throw new Error(message);
    }
  }, []);

  // Restore the existing session on startup, then keep state in sync with
  // Supabase auth state changes (sign-in, sign-out, token refresh, expiry).
  useEffect(() => {
    let cancelled = false;
    let subscription = null;

    async function initialize() {
      try {
        if (supabase) {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn("[AuthProvider] getSession failed", error);
          }
          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
        }
      } catch (err) {
        console.warn("[AuthProvider] session initialization failed", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialize();

    if (supabase) {
      subscription = supabase.auth.onAuthStateChange((event, newSession) => {
        if (cancelled) return;

        setSession(newSession || null);
        setUser(newSession ? newSession.user : null);
        setLoading(false);

        // Clear any stale init error once a real session state is known.
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          setInitError(null);
        }

        // Single-user enforcement: if the new session is not authorized, sign out.
        if (newSession && newSession.user && !isAuthorized(newSession.user)) {
          void supabase.auth.signOut();
        }
      });
    }

    return () => {
      cancelled = true;
      if (subscription) {
        subscription.data?.subscription?.unsubscribe?.();
      }
    };
  }, []); // supabase and isAuthorized are module-level constants, not reactive values

  const isAuthenticated = Boolean(user && session);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isAuthenticated,
      initError,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      isSupabaseConfigured: isSupabaseConfigured(),
    }),
    [user, session, loading, isAuthenticated, initError, signIn, signOut, resetPassword, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return ctx;
}
