// SubscriptionGate.jsx
import React from "react";
import { motion } from "framer-motion";

export default function SubscriptionGate({ onClose, requiredTier }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-zinc-800 rounded-xl shadow-xl p-6 max-w-md w-full text-center"
      >
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          🚫 Πρόσβαση Κλειδωμένη
        </h2>
        <p className="text-gray-700 dark:text-gray-200 mb-4">
          Αυτό το πρόγραμμα απαιτεί συνδρομή <span className="font-semibold">{requiredTier}</span> ή ανώτερη.
        </p>
        <div className="flex flex-col gap-3">
          <button
  onClick={() => setShowTierInfo(true)}
  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition"
>
  Αναβάθμισε Συνδρομή
</button>
{showTierInfo && <TierInfoModal onClose={() => setShowTierInfo(false)} />}

          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-zinc-600 text-gray-800 dark:text-white py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-500 transition"
          >
            Κλείσιμο
          </button>
        </div>
      </motion.div>
    </div>
  );
}
