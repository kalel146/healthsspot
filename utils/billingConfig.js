export const PLAN_CONFIG = {
  free: {
    key: 'free',
    name: "Free",
    stripeLookupKey: null,
    stripePriceEnv: null,
    appLevel: 'basic',
    subscriptionTier: 'Free',
    monthlyPriceLabel: '€0',
    monthlyPeriodLabel: '/ ξεκίνημα',
    badge: 'Start',
  },
  bronze: {
    key: 'bronze',
    name: 'Bronze',
    stripeLookupKey: 'hs_bronze_monthly',
    stripePriceEnv: 'STRIPE_PRICE_BRONZE_MONTHLY',
    appLevel: 'pro',
    subscriptionTier: 'Bronze',
    monthlyPriceLabel: '€9.99',
    monthlyPeriodLabel: '/ μήνα',
    badge: 'Accessible',
  },
  silver: {
    key: 'silver',
    name: 'Silver',
    stripeLookupKey: 'hs_silver_monthly',
    stripePriceEnv: 'STRIPE_PRICE_SILVER_MONTHLY',
    appLevel: 'pro',
    subscriptionTier: 'Silver',
    monthlyPriceLabel: '€19.99',
    monthlyPeriodLabel: '/ μήνα',
    badge: 'Best Value',
  },
  gold: {
    key: 'gold',
    name: 'Gold',
    stripeLookupKey: 'hs_gold_monthly',
    stripePriceEnv: 'STRIPE_PRICE_GOLD_MONTHLY',
    appLevel: 'elite',
    subscriptionTier: 'Gold',
    monthlyPriceLabel: '€29.99',
    monthlyPeriodLabel: '/ μήνα',
    badge: 'Performance',
  },
  platinum: {
    key: 'platinum',
    name: 'Platinum',
    stripeLookupKey: 'hs_platinum_monthly',
    stripePriceEnv: 'STRIPE_PRICE_PLATINUM_MONTHLY',
    appLevel: 'elite',
    subscriptionTier: 'Platinum',
    monthlyPriceLabel: '€49.99',
    monthlyPeriodLabel: '/ μήνα',
    badge: 'Flagship',
  },
};

export const PAID_PLAN_KEYS = Object.keys(PLAN_CONFIG).filter((key) => key !== 'free');
export const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'trialing'];

export function normalizePlanKey(value) {
  const raw = String(value || '').trim().toLowerCase();
  return PLAN_CONFIG[raw] ? raw : 'free';
}

export function getPlanConfig(planKey) {
  return PLAN_CONFIG[normalizePlanKey(planKey)] || PLAN_CONFIG.free;
}

export function getPaidPlanConfig(planKey) {
  const plan = getPlanConfig(planKey);
  return plan.key === 'free' ? null : plan;
}

export function isPaidPlanKey(planKey) {
  return normalizePlanKey(planKey) !== 'free';
}

export function getPlanKeyFromTier(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw || raw === 'free') return 'free';
  if (raw === 'bronze') return 'bronze';
  if (raw === 'silver') return 'silver';
  if (raw === 'gold') return 'gold';
  if (raw === 'platinum') return 'platinum';
  return 'free';
}

export function getPlanKeyFromLookupKey(value) {
  const raw = String(value || '').trim().toLowerCase();
  const match = Object.values(PLAN_CONFIG).find((plan) => String(plan.stripeLookupKey || '').toLowerCase() === raw);
  return match?.key || 'free';
}

export function getPlanKeyFromPriceId(value, priceMap = {}) {
  const raw = String(value || '').trim();
  if (!raw) return 'free';
  const entry = Object.entries(priceMap).find(([, priceId]) => String(priceId || '').trim() === raw);
  return entry?.[0] || 'free';
}

export function getSubscriptionTierFromPlanKey(planKey) {
  return getPlanConfig(planKey).subscriptionTier;
}

export function getAppLevelFromPlanKey(planKey) {
  return getPlanConfig(planKey).appLevel;
}

export function isSubscriptionStatusActive(status) {
  return ACTIVE_SUBSCRIPTION_STATUSES.includes(String(status || '').trim().toLowerCase());
}

export function normalizeBillingProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;

  const planKey = normalizePlanKey(
    profile.plan_key ||
      profile.planKey ||
      profile.subscription_tier ||
      profile.subscriptionTier ||
      profile.tier ||
      profile.plan
  );

  const subscriptionStatus = String(
    profile.subscription_status || profile.subscriptionStatus || profile.status || ''
  )
    .trim()
    .toLowerCase();

  return {
    clerkUserId: profile.clerk_user_id || profile.clerkUserId || null,
    email: profile.email || null,
    stripeCustomerId: profile.stripe_customer_id || profile.stripeCustomerId || null,
    stripeSubscriptionId: profile.stripe_subscription_id || profile.stripeSubscriptionId || null,
    planKey,
    subscriptionTier: getSubscriptionTierFromPlanKey(planKey),
    appLevel: getAppLevelFromPlanKey(planKey),
    subscriptionStatus,
    currentPeriodEnd: profile.current_period_end || profile.currentPeriodEnd || null,
    cancelAtPeriodEnd: Boolean(profile.cancel_at_period_end || profile.cancelAtPeriodEnd),
    isGiftedLifetime: Boolean(profile.is_gifted_lifetime || profile.isGiftedLifetime),
    isOwner: Boolean(profile.is_owner || profile.isOwner),
    raw: profile,
  };
}
