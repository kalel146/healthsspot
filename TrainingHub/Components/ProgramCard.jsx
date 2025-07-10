import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SubscriptionGate from "./SubscriptionGate";
import { useTheme } from "../../ThemeContext";

export default function ProgramCard({ program, userTier = "Free", selectedCategory }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { theme } = useTheme();

  const toggleDay = (index) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  const isLocked = (tier) => {
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
        <h2 className="text-2xl font-bold text-indigo-500 tracking-tight">
          {program.title}
        </h2>
        <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
          🎯 {program.goal || program.description} • 🕒 {program.duration} • ⚡ {program.level}
        </p>
        {isLocked(program.accessTier) && (
          <div
            className={`rounded-xl p-4 mt-2 ${
              theme === "dark"
                ? "bg-zinc-800 border border-red-500"
                : "bg-red-50 border border-red-300"
            }`}
          >
            <p className="text-red-500 font-medium">
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
                    key={"details"}
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
                        <li key={i}>
                          {ex.name} — {ex.sets}x{ex.reps}
                          {ex.intensity ? ` @ ${ex.intensity}` : ""}
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
