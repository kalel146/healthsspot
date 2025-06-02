// AiCoach.jsx
import React from "react";
import { motion } from "framer-motion";

export default function AiCoach({ coachAdvice, generateCoachAdvice }) {
  return (
    <motion.section
      className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-xl font-semibold text-amber-400">🧠 AI Coach</h2>
      <button
        onClick={generateCoachAdvice}
        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded mb-2"
      >
        Προπονητική Συμβουλή
      </button>
      {coachAdvice && (
        <p className="mt-2 text-amber-300 font-medium">{coachAdvice}</p>
      )}
    </motion.section>
  );
}
