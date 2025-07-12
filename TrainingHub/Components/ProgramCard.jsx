import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SubscriptionGate from "./SubscriptionGate";
import { useTheme } from "../../ThemeContext";

export default function ProgramCard({ program, userTier = "Free", selectedCategory, isAdmin = false, debugMode = false }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { theme } = useTheme();

  const toggleDay = (index) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  const isLocked = (tier) => {
    if (isAdmin || debugMode) return false;
    const tiers = ["Free", "Bronze", "Silver", "Gold", "Platinum"];
    return tiers.indexOf(userTier) < tiers.indexOf(tier);
  };

  const getEmoji = (type) => {
    if (!type) return "📅";
    const t = type.toLowerCase();
    if (t.includes("push")) return "💪";
    if (t.includes("pull")) return "🏋️";
    if (t.includes("legs")) return "🦵";
    if (t.includes("rest")) return "🧘";
    return "📅";
  };

  const borderColor =
    program.category === "gym"
      ? "border-indigo-500"
      : program.category === "indoor"
      ? "border-emerald-500"
      : program.category === "mobility"
      ? "border-yellow-400"
      : "border-gray-300";

  if (!program || (selectedCategory && program.category !== selectedCategory)) {
    return null;
  }

  const schedule = Array.isArray(program.schedule)
    ? program.schedule
    : Array.isArray(program.weeklySplit)
    ? program.weeklySplit
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl shadow-lg p-6 w-full max-w-3xl mx-auto border-2 ${borderColor} transition-colors duration-300 ${
        theme === "dark"
          ? "bg-zinc-900 border-zinc-700 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-indigo-500 tracking-tight">
            {program.title}
          </h2>
          {isAdmin && (
            <span className="ml-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
              Admin Preview
            </span>
          )}
        </div>
        <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
          <span title="Επίπεδο πρόσβασης χρήστη">
            🎯 {program.goal || program.description}
          </span> • 🕒 {program.duration} • ⚡ {program.level}
        </p>
        <span
          className="text-xs italic text-gray-400"
          title="Επίπεδο πρόσβασης απαιτούμενο για αυτό το πρόγραμμα"
        >
          Access Tier: {program.accessTier}
        </span>
        {debugMode && (
          <p className="text-xs font-mono text-red-500">
            [Debug] Tier: {program.accessTier} • Filename: {program.filename}
          </p>
        )}
        {isLocked(program.accessTier) && (
          <div
            className={`rounded-xl p-4 mt-2 ${
              theme === "dark"
                ? "bg-zinc-800 border border-red-500"
                : "bg-red-50 border border-red-300"
            }`}
          >
            <p
              className="text-red-500 font-medium"
              title="Αυτό το πρόγραμμα απαιτεί συνδρομή στο επίπεδο ή υψηλότερο για πρόσβαση"
            >
              🔒 Απαιτεί πακέτο {program.accessTier} ή ανώτερο
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="mt-3 bg-gradient-to-r from-red-600 to-pink-500 text-white px-4 py-2 rounded-lg shadow-lg hover:from-red-700 hover:to-pink-600 transition font-semibold"
            >
              Αναβάθμισε τώρα
            </motion.button>
          </div>
        )}
      </div>

      {!isLocked(program.accessTier) && (
        <div className="space-y-4">
          {schedule.map((day, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleDay(index)}
                className={`w-full text-left font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out ${
                  expandedDay === index
                    ? "bg-indigo-500 text-white shadow-inner"
                    : "bg-indigo-700 text-white hover:bg-indigo-600"
                }`}
                title={day.split || day.type || ""}
              >
                {getEmoji(day.type || day.split)} {day.day} — {day.type || day.split}
              </motion.button>
              <AnimatePresence>
                {expandedDay === index && (
                  <motion.div
                    key="details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`mt-3 ml-4 border-l-4 pl-4 ${
                      theme === "dark"
                        ? "border-indigo-400 text-zinc-300"
                        : "border-indigo-500 text-gray-700"
                    }`}
                  >
                    <ul className="list-disc text-sm space-y-1">
                      {day.exercises?.map((ex, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {ex.gif && (
                            <img src={ex.gif} alt={ex.name} className="w-8 h-8 rounded shadow-sm" />
                          )}
                          <span>
                            {ex.name} — {ex.sets}x{ex.reps}
                            {ex.intensity ? ` @ ${ex.intensity}` : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      <div className={`mt-6 text-xs italic ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
        📌 {program.notes || program.progression_advice}
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
