import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SubscriptionGate from "./SubscriptionGate";
import { useTheme } from "../../ThemeContext";

export default function ProgramCard({ program, userTier = "Free", selectedCategory, isAdmin = false, debugMode = false }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { theme } = useTheme();

  const toggleDay = (index) => setExpandedDay((prev) => (prev === index ? null : index));

  const isLocked = (tier) => {
    if (isAdmin || debugMode) return false;
    const tiers = ["Free", "Bronze", "Silver", "Gold", "Platinum"];
    return tiers.indexOf(userTier) < tiers.indexOf(tier || "Free");
  };

  const getEmoji = (type) => {
    if (!type) return "📅";
    const t = String(type).toLowerCase();
    if (t.includes("push")) return "💪";
    if (t.includes("pull")) return "🏋️";
    if (t.includes("legs") || t.includes("lower")) return "🦵";
    if (t.includes("rest")) return "🧘";
    return "📅";
  };

  const borderColor =
    program?.category === "gym"
      ? "border-indigo-500"
      : program?.category === "indoor"
      ? "border-emerald-500"
      : program?.category === "mobility"
      ? "border-yellow-400"
      : "border-gray-300";

  if (!program || (selectedCategory && program.category !== selectedCategory)) return null;

  const schedule = Array.isArray(program.schedule)
    ? program.schedule
    : Array.isArray(program.weeklySplit)
    ? program.weeklySplit
    : [];

  const phaseBadge = program.phase ? `Phase ${program.phase}` : null;

  const badgeColor = (tier) => {
    switch (tier) {
      case "Bronze": return "bg-amber-400 text-white";
      case "Silver": return "bg-gray-300 text-black";
      case "Gold": return "bg-yellow-400 text-white";
      case "Platinum": return "bg-gradient-to-r from-gray-500 to-white text-black";
      default: return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl shadow-lg p-6 w-full max-w-3xl mx-auto border-2 ${borderColor} transition-colors duration-300 ${
        theme === "dark" ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-gray-200 text-black"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-indigo-500 tracking-tight">{program.title}</h2>
          <div className="flex gap-2 items-center">
            {phaseBadge && (
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-indigo-800 dark:text-white">
                {phaseBadge}
              </span>
            )}
            {program.accessTier && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor(program.accessTier)}`}>
                {program.accessTier} Tier
              </span>
            )}
            {isAdmin && (
              <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">Admin Preview</span>
            )}
          </div>
        </div>
        <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
          🎯 {program.goal || program.description} • 🕒 {program.duration} • ⚡ {program.level}
        </p>
        {debugMode && (
          <p className="text-xs font-mono text-red-500">[Debug] Tier: {program.accessTier} • Filename: {program.filename}</p>
        )}
        {isLocked(program.accessTier) && (
          <div className={`${theme === "dark" ? "bg-zinc-800 border border-red-500" : "bg-red-50 border border-red-300"} rounded-xl p-4 mt-2`}>
            <p className="text-red-500 font-medium">🔒 Απαιτεί πακέτο {program.accessTier} ή ανώτερο</p>
          </div>
        )}
      </div>

      {/* Schedule */}
      {!isLocked(program.accessTier) && (
        <div className="space-y-4">
          {schedule.map((day, index) => {
            const hasExercises = Array.isArray(day?.exercises);
            const hasBlocks = Array.isArray(day?.warmup) || Array.isArray(day?.main) || Array.isArray(day?.cooldown);

            return (
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleDay(index)}
                  className={`w-full text-left font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out ${
                    expandedDay === index ? "bg-indigo-500 text-white shadow-inner" : "bg-indigo-700 text-white hover:bg-indigo-600"
                  }`}
                >
                  {getEmoji(day.type || day.split)} {day.day || day.type || `Session ${index + 1}`}
                </motion.button>

                <AnimatePresence initial={false}>
                  {expandedDay === index && (
                    <motion.div
                      key={`details-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={`mt-3 ml-4 border-l-4 pl-4 ${
                        theme === "dark" ? "border-indigo-400 text-zinc-300" : "border-indigo-500 text-gray-700"
                      }`}
                    >
                      {/* Format A: exercises */}
                      {hasExercises && (
                        <div className="space-y-2">
                          <div className="font-medium mb-1">Exercises</div>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {day.exercises.map((ex, i) => (
                              <li key={i} className="flex items-start gap-2">
                                {ex.gif && <img src={ex.gif} alt={ex.name} className="w-8 h-8 rounded shadow-sm" />}
                                <div>
                                  <div>
                                    <span className="font-semibold">{ex.name}</span>
                                    {(ex.sets || ex.reps) && (
                                      <span className="opacity-80"> — {ex.sets ? `${ex.sets} sets` : ""}{ex.sets && ex.reps ? " x " : ""}{ex.reps || ""}</span>
                                    )}
                                    {ex.intensity ? <span className="opacity-80"> @ {ex.intensity}</span> : null}
                                  </div>
                                  {ex.tips && <div className="text-xs opacity-70">💡 {ex.tips}</div>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Format B: warmup/main/cooldown */}
                      {hasBlocks && (
                        <div className="space-y-3 text-sm">
                          {Array.isArray(day.warmup) && (
                            <div>
                              <div className="font-medium mb-1">Warm‑up</div>
                              <ul className="list-disc pl-5 space-y-1">
                                {day.warmup.map((it, j) => (
                                  <li key={j}>{it}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(day.main) && (
                            <div>
                              <div className="font-medium mb-1">Main</div>
                              <ul className="list-disc pl-5 space-y-1">
                                {day.main.map((it, j) => (
                                  <li key={j}>{it}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(day.cooldown) && (
                            <div>
                              <div className="font-medium mb-1">Cooldown</div>
                              <ul className="list-disc pl-5 space-y-1">
                                {day.cooldown.map((it, j) => (
                                  <li key={j}>{it}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {!hasExercises && !hasBlocks && (
                        <div className="text-xs opacity-70">No detailed steps provided for this session.</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Notes */}
      <div className={`mt-6 text-xs italic ${theme === "dark" ? "text-zinc-500" : "text-gray-500"}`}>
        📌 {program.notes || program.progression_advice}
      </div>

      {/* Modal */}
      {showModal && <SubscriptionGate onClose={() => setShowModal(false)} requiredTier={program.accessTier} />}
    </motion.div>
  );
}
