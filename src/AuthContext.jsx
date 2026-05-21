import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth } from "./firebase";
import {
  getAccessStatus,
  getOrCreateAccountProfile
} from "./services/accountService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accountProfile, setAccountProfile] = useState(null);
  const [accessStatus, setAccessStatus] = useState({
    status: "unknown",
    hasAccess: false,
    daysRemaining: 0,
    isTrial: false,
    isExpired: true
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setAccountProfile(null);
        setAccessStatus({
          status: "unknown",
          hasAccess: false,
          daysRemaining: 0,
          isTrial: false,
          isExpired: true
        });
        setAuthLoading(false);
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
          status: "expired",
          hasAccess: false,
          daysRemaining: 0,
          isTrial: false,
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
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
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
      authLoading,
      accountLoading,
      loginWithGoogle,
      logout,
      refreshAccountProfile
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
