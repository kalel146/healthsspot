// PricingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "Bronze",
    price: "Δωρεάν",
    features: ["Power προγράμματα", "Basic Tracking"],
    cta: "Ξεκίνα δωρεάν"
  },
  {
    name: "Silver",
    price: "€9.99 / μήνα",
    features: ["+ Endurance / HIIT", "PDF Export", "Nutrition Sync"],
    cta: "Δες Silver"
  },
  {
    name: "Gold",
    price: "€19.99 / μήνα",
    features: ["+ Athletism (Basketball, Swim κ.ά.)", "AI Feedback", "Recovery Insights"],
    cta: "Δες Gold"
  },
  {
    name: "Platinum",
    price: "€29.99 / μήνα",
    features: ["Όλα τα παραπάνω", "Full Adaptive Coaching", "Priority Support"],
    cta: "Δες Platinum"
  }
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-12 px-6 bg-gradient-to-b from-zinc-900 to-black text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold">💳 Πακέτα Συνδρομής</h1>
          <p className="mt-3 text-sm text-zinc-300">
            Κράτα το απλό: δωρεάν preview για είσοδο, μετά καθαρό upgrade path. Όχι δέκα πακέτα και πανηγύρι.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-center text-sm text-yellow-200">
          Προτεινόμενη launch λογική: 1 μήνας δωρεάν feedback phase → μετά 3-day trial πριν τη χρέωση.
        </div>

        <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center text-sm text-cyan-200">
          Θέλεις να χαρίσεις full access σε συγκεκριμένους ανθρώπους χωρίς billing; Υποστηρίζεται πλέον με lifetime free allowlist.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="bg-zinc-800 rounded-xl shadow-lg p-6 flex flex-col justify-between border border-zinc-700"
            >
              <div>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-2">{plan.name}</h2>
                <p className="text-lg mb-4">{plan.price}</p>
                <ul className="list-disc pl-4 text-sm text-zinc-300 space-y-2">
                  {plan.features.map((feat, idx) => (
                    <li key={idx}>{feat}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => navigate(plan.name === "Bronze" ? "/dashboard" : "/programs")}
                className="mt-6 bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold"
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
