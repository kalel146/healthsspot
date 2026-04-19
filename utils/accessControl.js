import { LIFETIME_FREE_EMAIL_ALLOWLIST, OWNER_EMAIL_ALLOWLIST } from "./accessGrants";
import { getAppLevelFromPlanKey, getPlanKeyFromTier, getSubscriptionTierFromPlanKey, isSubscriptionStatusActive, normalizeBillingProfile } from "./billingConfig";

function readDelimitedEnvList(key) {
  try {
    const raw = import.meta?.env?.[key] || "";
    return String(raw)
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const APP_LEVELS = ["basic", "pro", "elite", "admin"];
const PROGRAM_TIERS = ["Free", "Bronze", "Silver", "Gold", "Platinum"];

const LEVEL_SYNONYMS = {
  free: "basic",
  basic: "basic",
  starter: "basic",
  preview: "basic",
  plus: "pro",
  paid: "pro",
  premium: "pro",
  pro: "pro",
  gold: "elite",
  elite: "elite",
  admin: "admin",
  owner: "admin",
};

const PROGRAM_TIER_SYNONYMS = {
  free: "Free",
  basic: "Free",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  premium: "Gold",
  platinum: "Platinum",
  elite: "Platinum",
  admin: "Platinum",
  owner: "Platinum",
  lifetime: "Platinum",
  gifted: "Platinum",
};

function safeString(value) {
  return String(value || "").trim();
}

function normalizeEmail(email) {
  return safeString(email).toLowerCase();
}

function normalizeDelimitedEmails(list = []) {
  return [...new Set((list || []).map(normalizeEmail).filter(Boolean))];
}

function getOwnerAllowlist(options = {}) {
  return normalizeDelimitedEmails([
    ...(OWNER_EMAIL_ALLOWLIST || []),
    ...(options.ownerAllowlist || []),
    ...readDelimitedEnvList("VITE_OWNER_EMAILS"),
  ]);
}

function getLifetimeFreeAllowlist(options = {}) {
  return normalizeDelimitedEmails([
    ...(LIFETIME_FREE_EMAIL_ALLOWLIST || []),
    ...(options.lifetimeFreeAllowlist || []),
    ...readDelimitedEnvList("VITE_LIFETIME_FREE_EMAILS"),
  ]);
}

export function normalizeAppLevel(value) {
  const normalized = LEVEL_SYNONYMS[safeString(value).toLowerCase()];
  return APP_LEVELS.includes(normalized) ? normalized : "basic";
}

export function normalizeProgramTier(value) {
  const normalized = PROGRAM_TIER_SYNONYMS[safeString(value).toLowerCase()];
  return PROGRAM_TIERS.includes(normalized) ? normalized : "Free";
}

export function getPrimaryEmail(user) {
  return normalizeEmail(user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress);
}

export function isLocalhost() {
  if (typeof window === "undefined") return false;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export function isLocalOwnerPreviewEnabled() {
  if (!isLocalhost()) return false;

  try {
    const params = new URLSearchParams(window.location.search);
    const forcedOff = params.get("ownerPreview") === "false" || window.localStorage.getItem("hs-owner-preview") === "false";
    if (forcedOff) return false;

    if (params.get("admin") === "true" || params.get("ownerPreview") === "true") {
      return true;
    }

    const stored = window.localStorage.getItem("hs-owner-preview");
    if (stored === null) {
      return true;
    }

    return stored === "true";
  } catch {
    return true;
  }
}

export function getUserMetadataSnapshot(user) {
  return {
    publicRole: safeString(user?.publicMetadata?.role).toLowerCase(),
    unsafeRole: safeString(user?.unsafeMetadata?.role).toLowerCase(),
    publicLevel: normalizeAppLevel(user?.publicMetadata?.userLevel),
    unsafeLevel: normalizeAppLevel(user?.unsafeMetadata?.userLevel),
    publicTier: normalizeProgramTier(
      user?.publicMetadata?.subscriptionTier || user?.publicMetadata?.tier || user?.publicMetadata?.plan
    ),
    unsafeTier: normalizeProgramTier(
      user?.unsafeMetadata?.subscriptionTier || user?.unsafeMetadata?.tier || user?.unsafeMetadata?.plan
    ),
    publicOnboarded: user?.publicMetadata?.isOnboarded === true,
    unsafeOnboarded: user?.unsafeMetadata?.isOnboarded === true,
    publicAccessGrant: safeString(user?.publicMetadata?.accessGrant || user?.publicMetadata?.grant).toLowerCase(),
    unsafeAccessGrant: safeString(user?.unsafeMetadata?.accessGrant || user?.unsafeMetadata?.grant).toLowerCase(),
    publicLifetimeFree: user?.publicMetadata?.lifetimeFree === true,
    unsafeLifetimeFree: user?.unsafeMetadata?.lifetimeFree === true,
  };
}

function isLifetimeGrantValue(value) {
  return ["lifetime", "lifetime_free", "gifted", "comped", "vip"].includes(safeString(value).toLowerCase());
}


function resolveBillingAccess(profileLike) {
  const billingProfile = normalizeBillingProfile(profileLike);
  if (!billingProfile) return null;

  if (billingProfile.isOwner) {
    return {
      billingProfile,
      hasActivePaidAccess: true,
      appLevel: 'admin',
      subscriptionTier: 'Platinum',
      planKey: 'platinum',
      subscriptionStatus: billingProfile.subscriptionStatus,
      source: 'billing_profile_owner',
    };
  }

  if (billingProfile.isGiftedLifetime) {
    return {
      billingProfile,
      hasActivePaidAccess: true,
      appLevel: 'elite',
      subscriptionTier: 'Platinum',
      planKey: 'platinum',
      subscriptionStatus: billingProfile.subscriptionStatus || 'gifted_lifetime',
      source: 'billing_profile_gifted',
    };
  }

  if (!isSubscriptionStatusActive(billingProfile.subscriptionStatus)) {
    return {
      billingProfile,
      hasActivePaidAccess: false,
      appLevel: 'basic',
      subscriptionTier: 'Free',
      planKey: 'free',
      subscriptionStatus: billingProfile.subscriptionStatus,
      source: 'billing_profile_inactive',
    };
  }

  return {
    billingProfile,
    hasActivePaidAccess: true,
    appLevel: getAppLevelFromPlanKey(billingProfile.planKey),
    subscriptionTier: getSubscriptionTierFromPlanKey(billingProfile.planKey),
    planKey: billingProfile.planKey,
    subscriptionStatus: billingProfile.subscriptionStatus,
    source: 'billing_profile_subscription',
  };
}

export function resolveUserAccess(user, options = {}) {
  const ownerAllowlist = getOwnerAllowlist(options);
  const lifetimeFreeAllowlist = getLifetimeFreeAllowlist(options);
  const email = getPrimaryEmail(user);
  const meta = getUserMetadataSnapshot(user);
  const localOwnerPreview = isLocalOwnerPreviewEnabled();
  const billingAccess = resolveBillingAccess(options.billingProfile);

  const isAdminByMetadata =
    meta.publicRole === "admin" ||
    meta.unsafeRole === "admin" ||
    meta.publicLevel === "admin" ||
    meta.unsafeLevel === "admin";

  const isOwnerByEmail = Boolean(email && ownerAllowlist.includes(email));
  const isLifetimeFreeByEmail = Boolean(email && lifetimeFreeAllowlist.includes(email));
  const isLifetimeFreeByMetadata =
    meta.publicLifetimeFree ||
    meta.unsafeLifetimeFree ||
    isLifetimeGrantValue(meta.publicAccessGrant) ||
    isLifetimeGrantValue(meta.unsafeAccessGrant);

  const isAdmin = isAdminByMetadata || isOwnerByEmail || localOwnerPreview || billingAccess?.source === "billing_profile_owner";
  const isLifetimeFree = !isAdmin && (isLifetimeFreeByEmail || isLifetimeFreeByMetadata || billingAccess?.source === "billing_profile_gifted");
  const hasActivePaidBilling = !isAdmin && !isLifetimeFree && Boolean(billingAccess?.hasActivePaidAccess);

  const appLevel = isAdmin
    ? "admin"
    : isLifetimeFree
    ? "elite"
    : hasActivePaidBilling
    ? billingAccess.appLevel
    : meta.publicLevel !== "basic"
    ? meta.publicLevel
    : meta.unsafeLevel;

  const subscriptionTier = isAdmin
    ? "Platinum"
    : isLifetimeFree
    ? "Platinum"
    : hasActivePaidBilling
    ? billingAccess.subscriptionTier
    : meta.publicTier !== "Free"
    ? meta.publicTier
    : meta.unsafeTier;

  const isOnboarded = meta.publicOnboarded || meta.unsafeOnboarded;

  let grantType = "standard";
  if (isAdmin) grantType = localOwnerPreview && !isOwnerByEmail && !isAdminByMetadata ? "local_preview" : "owner";
  else if (isLifetimeFree) grantType = "lifetime_free";
  else if (hasActivePaidBilling) grantType = "paid_subscription";

  return {
    email,
    isAdmin,
    isOwnerByEmail,
    isLifetimeFree,
    isLifetimeFreeByEmail,
    isLifetimeFreeByMetadata,
    isLocalOwnerPreview: localOwnerPreview,
    hasActivePaidBilling,
    billingProfile: billingAccess?.billingProfile || null,
    billingSource: billingAccess?.source || null,
    billingPlanKey: billingAccess?.planKey || getPlanKeyFromTier(subscriptionTier),
    billingSubscriptionStatus: billingAccess?.subscriptionStatus || null,
    appLevel: normalizeAppLevel(appLevel),
    subscriptionTier: normalizeProgramTier(subscriptionTier),
    isOnboarded,
    grantType,
    metadata: meta,
  };
}

export function getDisplayLevel(appLevel, options = {}) {
  if (options.isLifetimeFree) return "Gifted";

  switch (normalizeAppLevel(appLevel)) {
    case "admin":
      return "Admin";
    case "elite":
      return "Elite";
    case "pro":
      return "Pro";
    default:
      return "Basic";
  }
}

export function getAccessBadgeText(access) {
  if (access?.isAdmin) return "Full visibility";
  if (access?.isLifetimeFree) return "Lifetime free access";
  return `Program tier: ${normalizeProgramTier(access?.subscriptionTier)}`;
}

export function hasProgramTierAccess(userTier, requiredTier) {
  return PROGRAM_TIERS.indexOf(normalizeProgramTier(userTier)) >= PROGRAM_TIERS.indexOf(normalizeProgramTier(requiredTier));
}
