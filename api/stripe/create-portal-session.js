import { findBillingProfile, getAppUrl, getStripeClient } from "./_shared";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { clerkUserId, email } = req.body || {};
    if (!clerkUserId && !email) {
      return res.status(400).json({ error: "Missing clerkUserId or email" });
    }

    const billingProfile = await findBillingProfile({ clerkUserId, email });
    if (!billingProfile?.stripe_customer_id) {
      return res.status(404).json({ error: "No Stripe customer found for this account yet" });
    }

    const stripe = getStripeClient();
    const appUrl = getAppUrl(req);

    const session = await stripe.billingPortal.sessions.create({
      customer: billingProfile.stripe_customer_id,
      return_url: `${appUrl}/pricing`,
      configuration: process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID || undefined,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("[stripe/create-portal-session]", error);
    return res.status(500).json({ error: error?.message || "Failed to create portal session" });
  }
}
