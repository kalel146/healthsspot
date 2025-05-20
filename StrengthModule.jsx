import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeContext";

export default function StrengthModule() {
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(1);
  const [oneRM, setOneRM] = useState(null);
  const [rpe, setRpe] = useState("7");
  const [rir, setRir] = useState("3");

  const [stressData, setStressData] = useState({
    sleep: 3,
    energy: 3,
    pain: 3,
    mood: 3,
  });
  const [recoveryScore, setRecoveryScore] = useState(null);

  const { theme, toggleTheme } = useTheme();

  const calculateOneRM = () => {
    const result = weight * (36 / (37 - reps));
    setOneRM(result.toFixed(1));
  };

  const calculateRecovery = () => {
    const score =
      (parseInt(stressData.sleep) +
        parseInt(stressData.energy) +
        (6 - parseInt(stressData.pain)) +
        parseInt(stressData.mood)) /
      4;
    setRecoveryScore(score.toFixed(1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen px-6 py-10 space-y-10 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">Strength Lab</h1>
        <button
          onClick={toggleTheme}
          className="text-sm text-yellow-400 underline hover:text-yellow-300"
        >
          Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
      </div>

      {/* Brzycki 1RM */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Υπολογισμός 1RM (Brzycki)</h2>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Βάρος (kg)"
          className="bg-gray-800 text-white p-2 rounded w-full"
        />
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Επαναλήψεις (1-10)"
          className="bg-gray-800 text-white p-2 rounded w-full"
        />
        <button
          onClick={calculateOneRM}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Υπολόγισε 1RM
        </button>
        {oneRM && <p>1RM: {oneRM} kg</p>}
      </section>

      {/* RPE / RIR */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">RPE / RIR Tool</h2>
        <label>RPE:</label>
        <select
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          className="bg-gray-800 p-2 rounded w-full"
        >
          {[...Array(5)].map((_, i) => (
            <option key={i} value={i + 6}>{i + 6}</option>
          ))}
        </select>
        <label>RIR:</label>
        <select
          value={rir}
          onChange={(e) => setRir(e.target.value)}
          className="bg-gray-800 p-2 rounded w-full"
        >
          {[...Array(5)].map((_, i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </section>

      {/* Self-Report Recovery */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Self-Report Recovery</h2>
        {Object.keys(stressData).map((key) => (
          <div key={key}>
            <label>{key}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={stressData[key]}
              onChange={(e) =>
                setStressData({ ...stressData, [key]: e.target.value })
              }
              className="w-full"
            />
          </div>
        ))}
        <button
          onClick={calculateRecovery}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Υπολόγισε Recovery Score
        </button>
        {recoveryScore && <p>Recovery Score: {recoveryScore}</p>}
      </section>
    </motion.div>
  );
}
