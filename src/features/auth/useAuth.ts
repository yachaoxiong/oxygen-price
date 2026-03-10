import { useEffect, useState } from "react";

import { getCurrentUser, signInWithPassword, signOut } from "@/lib/supabase";
import type { AuthState } from "@/types/pricing";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function init() {
      const user = await getCurrentUser();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!mounted) return;

      if (user) {
        setUserId(user.id);
        setAuthState("authed");
      } else {
        setAuthState("guest");
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSignIn() {
    setAuthError("");
    try {
      await signInWithPassword(email, password);
      const user = await getCurrentUser();
      setUserId(user?.id ?? null);
      setAuthState(user ? "authed" : "guest");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "登录失败");
    }
  }

  async function handleSignOut() {
    await signOut();
    setUserId(null);
    setAuthState("guest");
  }

  return {
    authState,
    userId,
    email,
    setEmail,
    password,
    setPassword,
    authError,
    handleSignIn,
    handleSignOut,
  };
}
