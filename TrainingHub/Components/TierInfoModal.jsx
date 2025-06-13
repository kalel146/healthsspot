// TierInfoModal.jsx
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const tiers = ["Bronze", "Silver", "Gold", "Platinum"];
const features = [
  { name: "Πρόσβαση σε Power Προγράμματα", availability: ["Bronze", "Silver", "Gold", "Platinum"] },
  { name: "Προγράμματα Endurance & HIIT", availability: ["Silver", "Gold", "Platinum"] },
  { name: "Athletism Programs (Basketball, Swim κ.ά.)", availability: ["Gold", "Platinum"] },
  { name: "AI Προτάσεις & Feedback", availability: ["Platinum"] },
  { name: "PDF Export & Προσαρμογή Προγραμμάτων", availability: ["Silver", "Gold", "Platinum"] }
];

export default function TierInfoModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 max-w-3xl w-full"
      >
        <h2 className="text-2xl font-bold text-center text-indigo-600 dark:text-indigo-300 mb-6">
          💎 Σύγκριση Πακέτων Συνδρομής
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3">Λειτουργία</th>
                {tiers.map((tier) => (
                  <th key={tier} className="text-center py-2 px-3 text-indigo-600">{tier}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feat, i) => (
                <tr key={i} className="border-t dark:border-zinc-700">
                  <td className="py-2 px-3 font-medium text-gray-800 dark:text-gray-200">{feat.name}</td>
                  {tiers.map((tier) => (
                    <td key={tier} className="text-center">
                      {feat.availability.includes(tier) ? "✅" : "🔒"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <button
            onClick={() => navigate("/pricing")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Δες Αναλυτικά Πακέτα
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 dark:bg-zinc-700 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-zinc-600"
          >
            Κλείσιμο
          </button>
        </div>
      </motion.div>
    </div>
  );
}
