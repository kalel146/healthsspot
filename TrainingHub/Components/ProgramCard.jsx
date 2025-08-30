import React, { useState, useMemo } from "react";
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

  // -------------------------
  // NEW: Discipline header & badge chips (auto from subcategory/title/_src/specialty)
  // -------------------------
  const discipline = useMemo(() => {
    const cat = String(program?.category || "").toLowerCase();
    const sub = String(program?.subcategory || "").toLowerCase();
    const src = String(program?._src || "");
    const title = String(program?.title || "").toLowerCase();
    const spec = String(program?.specialty || "").toLowerCase();

    const chips = new Set();
    let label = null;

    if (cat === "athletism") {
      if (sub === "trackandfield") {
        if (/sprint|sprints|hurdle/i.test(src) || title.includes("sprint") || title.includes("hurdle")) {
          label = "Track & Field — Sprints/Hurdles";
          ["100", "200", "400", "110H/100H", "4x1"].forEach((c) => chips.add(c));
        } else if (/mdld|md_ld|mdld|md|ld|800|1500|5k|10k/i.test(src + title)) {
          label = "Track & Field — MD/LD";
          ["800", "1500", "5k", "10k"].forEach((c) => chips.add(c));
        } else if (/jumps|lj|tj|hj|pv/i.test(src + title)) {
          label = "Track & Field — Jumps";
          ["LJ", "TJ", "HJ", "PV"].forEach((c) => chips.add(c));
        } else if (/throws|sp|disc|jav|ham/i.test(src + title)) {
          label = "Track & Field — Throws";
          ["SP", "DISC", "JAV", "HAM"].forEach((c) => chips.add(c));
        } else if (/combined|deca|hepta/i.test(src + title)) {
          label = "Track & Field — Combined";
          ["Decathlon", "Heptathlon"].forEach((c) => chips.add(c));
        } else {
          label = "Track & Field";
        }
      } else if (sub === "swimming") {
        label = "Swimming";
        // Specialty contains the set
        if (spec.includes("sprint")) chips.add("Sprint");
        if (spec.includes("mid")) chips.add("Mid");
        if (spec.includes("distance")) chips.add("Distance");
        if (spec.includes("im")) chips.add("IM");
        // Phase-based extra hints
        const p = Number(program?.phase || 0);
        if (p >= 5 && p <= 6) chips.add("Race‑Pace");
        if (p >= 7 && p <= 8) chips.add("Modeling");
        if (p >= 9) chips.add("Taper");
      } else if (sub === "gymnastics") {
        label = "Gymnastics";
        ["MAG", "WAG"].forEach((c) => chips.add(c));
        const p = Number(program?.phase || 0);
        if (p >= 7) chips.add("Routines");
        if (p >= 9) chips.add("Taper");
      } else if (/soccer|football/.test(sub)) {
        label = "Soccer";
        ["S&C", "Agility", "Speed"].forEach((c) => chips.add(c));
      } else if (sub === "volleyball") {
        label = "Volleyball"; ["Jump", "Approach", "S&C"].forEach((c) => chips.add(c));
      } else if (sub.includes("nfl")) {
        label = "NFL"; ["Speed", "Power", "S&C"].forEach((c) => chips.add(c));
      }
    }

    return { label, chips: Array.from(chips) };
  }, [program]);

  const chipClasses =
    "text-[10px] font-semibold px-2 py-0.5 rounded-full border leading-none whitespace-nowrap";

  const borderColor =
    program?.category === "gym"
      ? "border-indigo-500"
      : program?.category === "indoor"
      ? "border-emerald-500"
      : program?.category === "mobility"
      ? "border-yellow-400"
      : program?.category === "athletism"
      ? "border-fuchsia-500"
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
      case "Platinum": return "bg-gradient-to-r from-gray-700 via-gray-200 to-gray-700 text-black";
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
      <div className="flex flex-col gap-2 mb-2">
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

        {/* NEW: Discipline header line */}
        {discipline.label && (
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide opacity-75">{discipline.label}</span>
            <div className="flex flex-wrap gap-1">
              {discipline.chips.map((c) => (
                <span key={c} className={`${chipClasses} ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-gray-100 border-gray-300"}`}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className={`text-sm ${theme === "dark" ? "text-zinc-400" : "text-gray-600"}`}>
          🎯 {program.goal || program.description} • 🕒 {program.duration} • ⚡ {program.level}
        </p>
        {debugMode && (
          <p className="text-xs font-mono text-red-500">[Debug] Tier: {program.accessTier} • Filename: {program.filename} • _src: {program._src}</p>
        )}
        {isLocked(program.accessTier) && (
          <div className={`${theme === "dark" ? "bg-zinc-800 border border-red-500" : "bg-red-50 border border-red-300"} rounded-xl p-4 mt-2 flex items-center justify-between gap-3`}>
            <p className="text-red-500 font-medium m-0">🔒 Απαιτεί πακέτο {program.accessTier} ή ανώτερο</p>
            <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow">
              Αναβάθμιση σε {program.accessTier}
            </button>
          </div>
        )}
      </div>

      {/* Schedule */}
      {!isLocked(program.accessTier) && (
        <div className="space-y-4">
          {schedule.map((day, index) => {
            const hasExercises = Array.isArray(day?.exercises);
            const hasBlocks = Array.isArray(day?.warmup) || Array.isArray(day?.main) || Array.isArray(day?.cooldown);

            const summaryInfo = hasExercises
              ? `${day.exercises.length} ασκήσεις`
              : hasBlocks
              ? [day.warmup?.length || 0, day.main?.length || 0, day.cooldown?.length || 0].reduce((a,b)=>a+b,0) + " στοιχεία"
              : null;

            return (
              <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleDay(index)}
                  className={`w-full text-left font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out flex justify-between items-center ${
                    expandedDay === index ? "bg-indigo-500 text-white shadow-inner" : "bg-indigo-700 text-white hover:bg-indigo-600"
                  }`}
                >
                  <span>{getEmoji(day.type || day.split)} {day.day || day.type || `Session ${index + 1}`} { (hasExercises || hasBlocks) && (
                    <span className="opacity-80 text-xs ml-2">
                      • {hasExercises ? `${day.exercises.length} drills` : `${(Array.isArray(day.warmup)?day.warmup.length:0) + (Array.isArray(day.main)?day.main.length:0) + (Array.isArray(day.cooldown)?day.cooldown.length:0)} items`}
                    </span>
                  ) }</span>
                  {summaryInfo && <span className="text-xs opacity-80">{summaryInfo}</span>}
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
