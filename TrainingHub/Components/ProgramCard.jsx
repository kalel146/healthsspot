// ProgramCard.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SubscriptionGate from "./SubscriptionGate";
import { useTheme } from "../../ThemeContext";

export default function ProgramCard({ jsonPath, userTier = "Free" }) {
  const [program, setProgram] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetch(jsonPath)
      .then((res) => res.json())
      .then((data) => setProgram(data))
      .catch((err) => console.error("Failed to load program:", err));
  }, [jsonPath]);

  const toggleDay = (index) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  const isLocked = (tier) => {
    const tiers = ["Free", "Bronze", "Silver", "Gold", "Platinum"];
    return tiers.indexOf(userTier) < tiers.indexOf(tier);
  };

  if (!program) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-sm text-zinc-500">Loading program...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl shadow-lg p-6 w-full max-w-3xl mx-auto transition-colors duration-300 ${
        theme === "dark"
          ? "bg-zinc-900 border border-zinc-700 text-white"
          : "bg-white border border-gray-200 text-black"
      }`}
    >
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-2xl font-bold text-indigo-500 tracking-tight">
          {program.title}
        </h2>
        <p className={`text-sm ${
          theme === "dark" ? "text-zinc-400" : "text-gray-600"
        }`}>
          🎯 {program.goal} • 🕒 {program.duration} • ⚡ {program.level}
        </p>
        {isLocked(program.accessTier) && (
          <div className={`rounded-xl p-4 mt-2 ${
            theme === "dark"
              ? "bg-zinc-800 border border-red-500"
              : "bg-red-50 border border-red-300"
          }`}>
            <p className="text-red-500 font-medium">
              🔒 Απαιτεί πακέτο {program.accessTier} ή ανώτερο
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition font-semibold"
            >
              Αναβάθμισε τώρα
            </button>
          </div>
        )}
      </div>

      {!isLocked(program.accessTier) && (
        <div className="space-y-4">
          {program.weeklySplit.map((day, index) => (
            <div key={index}>
              <button
                onClick={() => toggleDay(index)}
                className="w-full text-left font-semibold py-2 px-4 bg-indigo-700 text-white rounded-lg hover:bg-indigo-600 transition"
              >
                {day.day}
              </button>
              {expandedDay === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className={`mt-3 ml-4 border-l-4 pl-4 ${
                    theme === "dark"
                      ? "border-indigo-400 text-zinc-300"
                      : "border-indigo-500 text-gray-700"
                  }`}
                >
                  <ul className="list-disc text-sm">
                    {day.exercises.map((ex, i) => (
                      <li key={i}>
                        {ex.name} — {ex.sets}x{ex.reps}
                        {ex.intensity ? ` @ ${ex.intensity}` : ""}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className={`mt-6 text-xs italic ${
          theme === "dark" ? "text-zinc-500" : "text-gray-500"
        }`}
      >
        📌 {program.notes}
      </div>

      {showModal && (
        <SubscriptionGate
          onClose={() => setShowModal(false)}
          requiredTier={program.accessTier}
        />
      )}
    </motion.div>
  );
}
