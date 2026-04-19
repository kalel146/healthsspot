import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getPaidPlanConfig, getPlanKeyFromLookupKey, getPlanKeyFromPriceId, isPaidPlanKey, normalizePlanKey } from "../../utils/billingConfig";

function getRequiredEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
}

export function getStripeClient() {
  return new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
}

export function getAppUrl(req) {
  const explicit = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers.host || process.env.VERCEL_URL;
  if (!host) throw new Error("Unable to resolve APP_URL / host");
  return `${proto}://${host}`.replace(/\/$/, "");
}

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export async function findBillingProfile({ clerkUserId, email }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  if (clerkUserId) {
    const { data } = await supabase.from("billing_profiles").select("*").eq("clerk_user_id", clerkUserId).maybeSingle();
    if (data) return data;
  }

  if (email) {
    const { data } = await supabase.from("billing_profiles").select("*").eq("email", email).maybeSingle();
    if (data) return data;
  }

  return null;
}

export async function upsertBillingProfile(payload) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { skipped: true };

  const record = {
    clerk_user_id: payload.clerkUserId || null,
    email: payload.email || null,
    stripe_customer_id: payload.stripeCustomerId || null,
    stripe_subscription_id: payload.stripeSubscriptionId || null,
    plan_key: normalizePlanKey(payload.planKey),
    subscription_status: payload.subscriptionStatus || null,
    current_period_end: payload.currentPeriodEnd || null,
    cancel_at_period_end: Boolean(payload.cancelAtPeriodEnd),
    is_gifted_lifetime: Boolean(payload.isGiftedLifetime),
    is_owner: Boolean(payload.isOwner),
    raw_subscription: payload.rawSubscription || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("billing_profiles")
    .upsert(record, { onConflict: "clerk_user_id" })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function resolveOrCreateStripeCustomer({ stripe, clerkUserId, email }) {
  const existing = await findBillingProfile({ clerkUserId, email });
  if (existing?.stripe_customer_id) {
    return { customerId: existing.stripe_customer_id, billingProfile: existing };
  }

  if (!email) {
    return { customerId: null, billingProfile: existing };
  }

  const customer = await stripe.customers.create({
    email,
    metadata: {
      clerkUserId: clerkUserId || "",
    },
  });

  await upsertBillingProfile({
    clerkUserId,
    email,
    stripeCustomerId: customer.id,
    planKey: existing?.plan_key || "free",
    subscriptionStatus: existing?.subscription_status || null,
    currentPeriodEnd: existing?.current_period_end || null,
    cancelAtPeriodEnd: existing?.cancel_at_period_end || false,
    isGiftedLifetime: existing?.is_gifted_lifetime || false,
    isOwner: existing?.is_owner || false,
    rawSubscription: existing?.raw_subscription || null,
  });

  return { customerId: customer.id, billingProfile: existing || null };
}

export function getConfiguredPriceMap() {
  return {
    bronze: process.env.STRIPE_PRICE_BRONZE_MONTHLY || "",
    silver: process.env.STRIPE_PRICE_SILVER_MONTHLY || "",
    gold: process.env.STRIPE_PRICE_GOLD_MONTHLY || "",
    platinum: process.env.STRIPE_PRICE_PLATINUM_MONTHLY || "",
  };
}

export async function resolveStripePriceId({ stripe, planKey }) {
  const paidPlan = getPaidPlanConfig(planKey);
  if (!paidPlan || !isPaidPlanKey(planKey)) {
    throw new Error("Invalid paid plan key");
  }

  const configured = process.env[paidPlan.stripePriceEnv || ""];
  if (configured) return configured;

  const prices = await stripe.prices.list({
    lookup_keys: [paidPlan.stripeLookupKey],
    active: true,
    limit: 1,
    expand: ["data.product"],
  });

  const price = prices.data?.[0];
  if (!price?.id) {
    throw new Error(`No active Stripe price found for lookup key ${paidPlan.stripeLookupKey}`);
  }

  return price.id;
}

export function derivePlanKeyFromStripeObject({ metadataPlanKey, lookupKey, priceId }) {
  const fromMeta = normalizePlanKey(metadataPlanKey);
  if (isPaidPlanKey(fromMeta)) return fromMeta;

  const fromLookup = getPlanKeyFromLookupKey(lookupKey);
  if (isPaidPlanKey(fromLookup)) return fromLookup;

  const fromPriceId = getPlanKeyFromPriceId(priceId, getConfiguredPriceMap());
  if (isPaidPlanKey(fromPriceId)) return fromPriceId;

  return "free";
}

export async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
