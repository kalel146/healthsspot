import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { resolveUserAccess } from "../../utils/accessControl";
import { PLAN_CONFIG } from "../../utils/billingConfig";

const plans = [
  {
    ...PLAN_CONFIG.free,
    featured: false,
    cta: "Start Free",
    features: [
      "Dashboard & βασική πρόσβαση",
      "Strength / Cardio / Recovery core tools",
      "Περιορισμένη πρόσβαση σε προγράμματα",
      "Ιδανικό για πρώτη γνωριμία με την πλατφόρμα",
    ],
  },
  {
    ...PLAN_CONFIG.bronze,
    featured: false,
    cta: "Choose Bronze",
    features: [
      "Πιο πλήρες tracking & history",
      "Καλύτερη ροή χρήσης στα βασικά modules",
      "Περισσότερα προγράμματα και exports βάσης",
      "Κατάλληλο για τους περισσότερους active users",
    ],
  },
  {
    ...PLAN_CONFIG.silver,
    featured: true,
    cta: "Choose Silver",
    features: [
      "Πλήρες Nutrition access",
      "Cloud / history sync",
      "Πιο βαθιά dashboards και planning",
      "Για χρήστες που θέλουν σοβαρό daily use",
    ],
  },
  {
    ...PLAN_CONFIG.gold,
    featured: false,
    cta: "Choose Gold",
    features: [
      "Athletism & advanced programs",
      "Advanced insights και premium analytics",
      "Πιο εξελιγμένο coaching layer",
      "Για απαιτητικούς αθλητές και power users",
    ],
  },
  {
    ...PLAN_CONFIG.platinum,
    featured: false,
    cta: "Choose Platinum",
    features: [
      "Όλα τα modules και όλα τα premium εργαλεία",
      "Full flagship experience",
      "Priority support & future premium releases",
      "Για όσους θέλουν όλο το οικοσύστημα",
    ],
  },
];

function AccessNotice({ access }) {
  if (access.isAdmin) {
    return (
      <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
        Owner/Admin access active. Εσύ δεν αγοράζεις plan, εσύ κρατάς τα κλειδιά του μαγαζιού.
      </div>
    );
  }

  if (access.isLifetimeFree) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        Gifted lifetime access active. Αυτός ο λογαριασμός έχει μόνιμη premium πρόσβαση χωρίς billing.
      </div>
    );
  }

  if (access.hasActivePaidBilling) {
    return (
      <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
        Active paid access detected. Τώρα το billing διαβάζεται από πραγματικό subscription state, όχι από metadata σαλάτα.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
      Έτοιμο για live billing: κάθε paid plan ανοίγει Stripe Checkout, δέχεται promo codes και μετά η συνδρομή διαβάζεται από webhook-synced billing profile.
    </div>
  );
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const access = useMemo(() => resolveUserAccess(user), [user]);
  const [pendingPlan, setPendingPlan] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartFree = () => {
    if (user) {
      navigate("/dashboard");
      return;
    }
    navigate("/sign-up");
  };

  const handleCheckout = async (planKey) => {
    if (planKey === "free") {
      handleStartFree();
      return;
    }

    if (!user) {
      navigate(`/sign-up?plan=${planKey}`);
      return;
    }

    if (access.isAdmin || access.isLifetimeFree) {
      navigate("/dashboard");
      return;
    }

    try {
      setError("");
      setPendingPlan(planKey);
      const data = await postJson("/api/stripe/create-checkout-session", {
        planKey,
        clerkUserId: user.id,
        email: access.email,
      });

      if (!data?.url) {
        throw new Error("Missing checkout URL");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err?.message || "Checkout failed");
    } finally {
      setPendingPlan("");
    }
  };

  const handleOpenPortal = async () => {
    if (!user || access.isAdmin || access.isLifetimeFree) return;

    try {
      setError("");
      setPortalLoading(true);
      const data = await postJson("/api/stripe/create-portal-session", {
        clerkUserId: user.id,
        email: access.email,
      });

      if (!data?.url) {
        throw new Error("Missing portal URL");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err?.message || "Portal failed");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
            Health&apos;s Spot Plans
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Καθαρές επιλογές. Χωρίς μισές εξηγήσεις.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-300 md:text-base">
            Διάλεξε το επίπεδο που ταιριάζει στη χρήση σου. Ξεκίνα δωρεάν, ανέβα όταν χρειάζεσαι περισσότερα,
            και κράτα το billing απλό αντί να το κάνουμε θρίλερ.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-4xl">
          <AccessNotice access={access} />
        </div>

        {error && (
          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-5">
          {plans.map((plan) => {
            const isPending = pendingPlan === plan.key;
            const isCurrentPaidPlan = access.hasActivePaidBilling && access.billingPlanKey === plan.key;
            return (
              <div
                key={plan.key}
                className={`flex min-h-[460px] flex-col rounded-3xl border p-6 shadow-xl transition-transform duration-300 hover:-translate-y-1 ${
                  plan.featured
                    ? "border-yellow-400 bg-gradient-to-b from-zinc-900 to-zinc-950 ring-2 ring-yellow-400/40"
                    : "border-white/10 bg-zinc-900/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">{plan.name}</h2>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-3xl font-black text-yellow-400">{plan.monthlyPriceLabel}</span>
                      <span className="pb-1 text-sm text-zinc-400">{plan.monthlyPeriodLabel}</span>
                    </div>
                  </div>
                  <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-yellow-300">
                    {plan.badge}
                  </span>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="text-yellow-400">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.key)}
                  disabled={isPending || isCurrentPaidPlan}
                  className={`mt-auto rounded-2xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    plan.featured
                      ? "bg-yellow-500 text-black hover:bg-yellow-400"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {isCurrentPaidPlan ? "Current Plan" : isPending ? "Opening Checkout..." : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6">
            <h3 className="text-xl font-black text-yellow-400">Discount codes / coach coupons</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Το checkout δέχεται promo codes. Εκεί βάζεις πραγματικά discount campaigns από 10% έως 70%, χωρίς custom πατέντες που μετά σε κυνηγάνε.
            </p>
            <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
              Coach examples: <strong>WELCOME10</strong>, <strong>CLIENT25</strong>, <strong>VIP50</strong>, <strong>INNERCIRCLE70</strong>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-6">
            <h3 className="text-xl font-black text-yellow-400">Billing actions</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Όταν ο χρήστης έχει Stripe customer profile, το Customer Portal αναλαμβάνει upgrade, downgrade, κάρτες και cancel χωρίς να χτίζεις δικό σου billing λαβύρινθο.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => navigate(user ? "/dashboard" : "/sign-up")}
                className="rounded-2xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400"
              >
                {user ? "Go to Dashboard" : "Create Account"}
              </button>
              <button
                onClick={handleOpenPortal}
                disabled={!user || access.isAdmin || access.isLifetimeFree || portalLoading}
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {portalLoading ? "Opening Portal..." : "Manage Billing"}
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl rounded-3xl border border-white/10 bg-zinc-900/80 p-6 text-sm text-zinc-300">
          <strong className="text-white">Important:</strong> Owner και gifted lifetime users παρακάμπτουν πλήρως το billing. Τα paid plans είναι μόνο για κανονικούς πελάτες.
        </div>
      </div>
    </div>
  );
}
