export function getAccessStatus(userData) {
  if (!userData) return { allowed: false, reason: "no-user-data" };

  const now = new Date();
  const trialEndsAt = userData.trialEndsAt?.toDate
    ? userData.trialEndsAt.toDate()
    : new Date(userData.trialEndsAt);

  const isTrialActive =
    userData.subscriptionStatus === "trial" && trialEndsAt > now;

  const isSubscriptionActive =
    userData.subscriptionStatus === "active";

  if (isTrialActive) {
    return {
      allowed: true,
      mode: "trial",
      allowedModules: "all",
      trialEndsAt,
    };
  }

  if (isSubscriptionActive) {
    return {
      allowed: true,
      mode: "paid",
      plan: userData.plan,
      allowedModules: userData.allowedModules,
    };
  }

  return {
    allowed: false,
    reason: "trial-expired",
  };
}

export function canAccessModule(access, moduleKey) {
  if (!access?.allowed) return false;
  if (access.allowedModules === "all") return true;
  return access.allowedModules?.includes(moduleKey);
}
