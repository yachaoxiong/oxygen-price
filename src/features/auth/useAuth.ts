import { useEffect, useState } from "react";

import { fetchUserProfile, getCurrentUser, signInWithPassword, signOut } from "@/lib/supabase";
import type { AuthState } from "@/types/pricing";
import type { UserProfile } from "@/lib/supabase";

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const user = await getCurrentUser();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!mounted) return;

      if (user) {
        setUserId(user.id);
        setAuthState("authed");
        try {
          const userProfile = await fetchUserProfile(user.id);
          setProfile(userProfile);
        } catch {
          setProfile(null);
        }
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
      if (user) {
        const userProfile = await fetchUserProfile(user.id);
        setProfile(userProfile);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "登录失败");
    }
  }

  async function handleSignOut() {
    await signOut();
    setUserId(null);
    setProfile(null);
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
    profile,
    handleSignIn,
    handleSignOut,
  };
}
