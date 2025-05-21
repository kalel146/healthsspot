import React, { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
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

  const stressLabels = {
    sleep: "Ύπνος",
    energy: "Ενέργεια",
    pain: "Μυϊκός Πόνος",
    mood: "Διάθεση",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen px-4 py-10 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Helmet>
        <title>Strength Training | Health's Spot</title>
        <meta
          name="description"
          content="Υπολόγισε 1RM, RPE και Recovery score για την προπόνησή σου στο Strength Lab του Health's Spot."
        />
        <link rel="canonical" href="https://healthsspot.vercel.app/training" />
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Strength Lab</h1>
          <button
            onClick={toggleTheme}
            className="text-sm px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* Brzycki 1RM */}
        <section className="space-y-4 border border-yellow-500 p-5 rounded-xl">
          <h2 className="text-xl font-semibold text-yellow-400">Υπολογισμός 1RM (Brzycki)</h2>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Βάρος (kg)"
            className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="Επαναλήψεις (1-10)"
            className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
          />
          <button
            onClick={calculateOneRM}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold"
          >
            Υπολόγισε 1RM
          </button>
          {oneRM && <p className="text-lg font-bold">1RM: {oneRM} kg</p>}
        </section>

        {/* RPE / RIR */}
        <section className="space-y-4 border border-purple-500 p-5 rounded-xl">
          <h2 className="text-xl font-semibold text-purple-400">RPE / RIR Tool</h2>
          <div>
            <label className="block font-medium">RPE:</label>
            <select
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
            >
              {[...Array(5)].map((_, i) => (
                <option key={i} value={i + 6}>{i + 6}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">RIR:</label>
            <select
              value={rir}
              onChange={(e) => setRir(e.target.value)}
              className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
            >
              {[...Array(5)].map((_, i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Self-Report Recovery */}
        <section className="space-y-4 border border-blue-500 p-5 rounded-xl">
          <h2 className="text-xl font-semibold text-blue-400">Self-Report Recovery</h2>
          {Object.keys(stressData).map((key) => (
            <div key={key} className="space-y-1">
              <label className="block font-medium">{stressLabels[key]}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={stressData[key]}
                onChange={(e) =>
                  setStressData({ ...stressData, [key]: e.target.value })
                }
                className="w-full accent-blue-500"
              />
              <div className="text-sm text-gray-400">Τρέχουσα τιμή: {stressData[key]}</div>
            </div>
          ))}
          <button
            onClick={calculateRecovery}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold"
          >
            Υπολόγισε Recovery Score
          </button>
          {recoveryScore && (
            <p className="mt-2 text-lg font-bold text-blue-400">
              Recovery Score: {recoveryScore}
            </p>
          )}
        </section>
      </div>
    </motion.div>
  );
}