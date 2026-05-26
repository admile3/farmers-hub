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

function calculateDaysRemaining(trialEnd) {
  if (!trialEnd) return 0;

  const endDate = trialEnd?.toDate
    ? trialEnd.toDate()
    : new Date(trialEnd);

  const now = new Date();

  const diffMs = endDate.getTime() - now.getTime();

  return Math.max(
    0,
    Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  );
}

export function getAccessStatus(account) {
  if (!account) {
    return {
      status: "unknown",
      hasAccess: false,
      daysRemaining: 0,
      isTrial: false,
      isExpired: true,
      plan: null,
      allowedModules: []
    };
  }

  if (account.subscriptionStatus === "admin") {
    return {
      status: "admin",
      hasAccess: true,
      daysRemaining: null,
      isTrial: false,
      isExpired: false,
      plan: "admin",
      allowedModules: "all"
    };
  }

  if (account.subscriptionStatus === "active") {
    return {
      status: "active",
      hasAccess: true,
      daysRemaining: null,
      isTrial: false,
      isExpired: false,
      plan: account.subscriptionPlan || null,
      allowedModules: account.allowedModules || []
    };
  }

  const daysRemaining = calculateDaysRemaining(account.trialEnd);

  const isTrial =
    account.subscriptionStatus === "trial" &&
    daysRemaining > 0;

  return {
    status: isTrial ? "trial" : "expired",

    hasAccess: isTrial,

    daysRemaining,

    isTrial,

    isExpired: !isTrial,

    plan: "trial",

    allowedModules: "all"
  };
}

export async function getOrCreateAccountProfile(user) {
  if (!user) return null;

  const accountRef = doc(
    db,
    "users",
    user.uid,
    "account",
    "profile"
  );

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

    allowedModules: "all",

    stripeCustomerId: null,

    stripeSubscriptionId: null
  };

  await setDoc(accountRef, profile, {
    merge: true
  });

  return profile;
}

export async function updateAccountProfile(
  userId,
  updates
) {
  const accountRef = doc(
    db,
    "users",
    userId,
    "account",
    "profile"
  );

  await setDoc(
    accountRef,
    {
      ...updates,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export function canAccessModule(account, moduleKey) {
  if (!account) return false;

  const access = getAccessStatus(account);

  if (!access.hasAccess) return false;

  if (access.allowedModules === "all") {
    return true;
  }

  if (!Array.isArray(access.allowedModules)) {
    return false;
  }

  return access.allowedModules.includes(moduleKey);
}
