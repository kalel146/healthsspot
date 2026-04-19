import { derivePlanKeyFromStripeObject, getRawBody, getStripeClient, upsertBillingProfile } from "./_shared";

export const config = {
  api: {
    bodyParser: false,
  },
};

function toIsoSeconds(epochSeconds) {
  return epochSeconds ? new Date(epochSeconds * 1000).toISOString() : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const signature = req.headers["stripe-signature"];
  if (!signature) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  try {
    const stripe = getStripeClient();
    const rawBody = await getRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ["items.data.price"],
          });
          const price = subscription.items?.data?.[0]?.price;
          const planKey = derivePlanKeyFromStripeObject({
            metadataPlanKey: session.metadata?.planKey || subscription.metadata?.planKey,
            lookupKey: price?.lookup_key,
            priceId: price?.id,
          });

          await upsertBillingProfile({
            clerkUserId: session.client_reference_id || session.metadata?.clerkUserId || subscription.metadata?.clerkUserId || null,
            email: session.customer_details?.email || session.metadata?.email || subscription.metadata?.email || null,
            stripeCustomerId: session.customer || subscription.customer || null,
            stripeSubscriptionId: subscription.id,
            planKey,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: toIsoSeconds(subscription.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            rawSubscription: subscription,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const price = subscription.items?.data?.[0]?.price;
        const planKey = derivePlanKeyFromStripeObject({
          metadataPlanKey: subscription.metadata?.planKey,
          lookupKey: price?.lookup_key,
          priceId: price?.id,
        });

        await upsertBillingProfile({
          clerkUserId: subscription.metadata?.clerkUserId || null,
          email: subscription.metadata?.email || null,
          stripeCustomerId: subscription.customer || null,
          stripeSubscriptionId: subscription.id,
          planKey,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: toIsoSeconds(subscription.current_period_end),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          rawSubscription: subscription,
        });
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[stripe/webhook]", error);
    return res.status(400).json({ error: error?.message || "Webhook failed" });
  }
}
