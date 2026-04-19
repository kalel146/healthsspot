import { getAppUrl, getStripeClient, resolveOrCreateStripeCustomer, resolveStripePriceId } from "./_shared";
import { getPaidPlanConfig, normalizePlanKey } from "../../utils/billingConfig";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { planKey, clerkUserId, email } = req.body || {};
    const normalizedPlanKey = normalizePlanKey(planKey);
    const plan = getPaidPlanConfig(normalizedPlanKey);

    if (!plan) {
      return res.status(400).json({ error: "Invalid paid plan" });
    }

    if (!clerkUserId) {
      return res.status(400).json({ error: "Missing clerkUserId" });
    }

    const stripe = getStripeClient();
    const appUrl = getAppUrl(req);
    const { customerId } = await resolveOrCreateStripeCustomer({ stripe, clerkUserId, email });
    const priceId = await resolveStripePriceId({ stripe, planKey: normalizedPlanKey });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: `${appUrl}/pricing?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customerId || undefined,
      customer_email: customerId ? undefined : email || undefined,
      client_reference_id: clerkUserId,
      metadata: {
        clerkUserId,
        email: email || "",
        planKey: normalizedPlanKey,
      },
      subscription_data: {
        metadata: {
          clerkUserId,
          email: email || "",
          planKey: normalizedPlanKey,
        },
      },
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (error) {
    console.error("[stripe/create-checkout-session]", error);
    return res.status(500).json({ error: error?.message || "Failed to create checkout session" });
  }
}
