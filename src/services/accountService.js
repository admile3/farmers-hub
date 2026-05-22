import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { db } from "../firebase";

const TRIAL_DAYS = 15;

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getAccessStatus(account) {
  if (!account) {
    return {
      status: "unknown",
      hasAccess: false,
      daysRemaining: 0,
      isTrial: false,
      isExpired: true
    };
  }

  if (account.subscriptionStatus === "admin") {
    return {
      status: "admin",
      hasAccess: true,
      daysRemaining: null,
      isTrial: false,
      isExpired: false
    };
  }

  if (account.subscriptionStatus === "active") {
    return {
      status: "active",
      hasAccess: true,
      daysRemaining: null,
      isTrial: false,
      isExpired: false
    };
  }

  const trialEnd = account.trialEnd?.toDate
    ? account.trialEnd.toDate()
    : account.trialEnd
      ? new Date(account.trialEnd)
      : null;

  if (!trialEnd) {
    return {
      status: "expired",
      hasAccess: false,
      daysRemaining: 0,
      isTrial: false,
      isExpired: true
    };
  }

  const now = new Date();
  const diffMs = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const hasAccess = diffMs > 0;

  return {
    status: hasAccess ? "trial" : "expired",
    hasAccess,
    daysRemaining,
    isTrial: hasAccess,
    isExpired: !hasAccess
  };
}

export async function getOrCreateAccountProfile(user) {
  if (!user) return null;

  const accountRef = doc(db, "users", user.uid, "account", "profile");
  const snapshot = await getDoc(accountRef);

  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...snapshot.data()
    };
  }

  const now = new Date();
  const trialEnd = addDays(now, TRIAL_DAYS);

  const profile = {
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    trialStart: now.toISOString(),
    trialEnd: trialEnd.toISOString(),
    subscriptionStatus: "trial",
    subscriptionPlan: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeCheckoutUrl: null
  };

  await setDoc(accountRef, profile, { merge: true });

  return profile;
}

export async function updateAccountProfile(userId, updates) {
  const accountRef = doc(db, "users", userId, "account", "profile");

  await setDoc(
    accountRef,
    {
      ...updates,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}
