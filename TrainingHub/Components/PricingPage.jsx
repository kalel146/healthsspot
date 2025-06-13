// PricingPage.jsx
import React from "react";

const plans = [
  {
    name: "Bronze",
    price: "Δωρεάν",
    features: ["Power προγράμματα", "Basic Tracking"]
  },
  {
    name: "Silver",
    price: "€9.99 / μήνα",
    features: ["+ Endurance / HIIT", "PDF Export", "Nutrition Sync"]
  },
  {
    name: "Gold",
    price: "€19.99 / μήνα",
    features: ["+ Athletism (Basketball, Swim κ.ά.)", "AI Feedback", "Recovery Insights"]
  },
  {
    name: "Platinum",
    price: "€29.99 / μήνα",
    features: ["Όλα τα παραπάνω", "Full Adaptive Coaching", "Priority Support"]
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen py-12 px-6 bg-gradient-to-b from-zinc-900 to-black text-white">
      <h1 className="text-4xl font-bold text-center mb-10">💳 Πακέτα Συνδρομής</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="bg-zinc-800 rounded-xl shadow-lg p-6 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl font-semibold text-yellow-400 mb-2">{plan.name}</h2>
              <p className="text-lg mb-4">{plan.price}</p>
              <ul className="list-disc pl-4 text-sm text-zinc-300">
                {plan.features.map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>
            </div>
            <button className="mt-6 bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition">
              Επιλογή Πακέτου
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
