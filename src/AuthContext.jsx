import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import {
  getAccessStatus,
  getOrCreateAccountProfile
} from "./services/accountService.js";

const AuthContext = createContext(null);

const defaultAccessStatus = {
  status: "unknown",
  hasAccess: false,
  daysRemaining: 0,
  isTrial: false,
  isExpired: true,
  plan: null,
  allowedModules: [],
  trialEndsAt: null
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accountProfile, setAccountProfile] = useState(null);
  const [accessStatus, setAccessStatus] = useState(defaultAccessStatus);
  const [authLoading, setAuthLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setAccountProfile(null);
        setAccessStatus(defaultAccessStatus);
        setAuthLoading(false);
        setAccountLoading(false);
        return;
      }

      setAccountLoading(true);

      try {
        const profile = await getOrCreateAccountProfile(firebaseUser);
        const access = getAccessStatus(profile);

        setAccountProfile(profile);
        setAccessStatus(access);
      } catch (error) {
        console.error("Could not load account profile:", error);

        setAccountProfile(null);
        setAccessStatus({
          ...defaultAccessStatus,
          status: "expired",
          hasAccess: false,
          isExpired: true
        });
      } finally {
        setAccountLoading(false);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  async function refreshAccountProfile() {
    if (!user) return null;

    setAccountLoading(true);

    try {
      const profile = await getOrCreateAccountProfile(user);
      const access = getAccessStatus(profile);

      setAccountProfile(profile);
      setAccessStatus(access);

      return profile;
    } catch (error) {
      console.error("Could not refresh account profile:", error);
      return null;
    } finally {
      setAccountLoading(false);
    }
  }

  function canAccessModule(moduleKey) {
    if (!accessStatus?.hasAccess) return false;

    if (accessStatus.allowedModules === "all") return true;

    if (!Array.isArray(accessStatus.allowedModules)) return false;

    return accessStatus.allowedModules.includes(moduleKey);
  }

  const value = useMemo(
    () => ({
      user,
      accountProfile,
      accessStatus,

      hasAccess: accessStatus.hasAccess,
      isAdmin: accessStatus.status === "admin",
      isTrial: accessStatus.isTrial,
      isExpired: accessStatus.isExpired,
      daysRemaining: accessStatus.daysRemaining,
      plan: accessStatus.plan,
      allowedModules: accessStatus.allowedModules,

      authLoading,
      accountLoading,

      loginWithGoogle,
      logout,
      refreshAccountProfile,
      canAccessModule
    }),
    [user, accountProfile, accessStatus, authLoading, accountLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
