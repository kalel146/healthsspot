import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

export default function RecoveryModule() {
  const [inputs, setInputs] = useState({
    sleep: 3,
    energy: 3,
    pain: 3,
    mood: 3,
    stress: 3,
  });
  const [score, setScore] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const handleChange = (key, value) => {
    setInputs({ ...inputs, [key]: value });
  };

  const calculateRecovery = () => {
    const adjustedPain = 6 - parseInt(inputs.pain);
    const total =
      parseInt(inputs.sleep) +
      parseInt(inputs.energy) +
      adjustedPain +
      parseInt(inputs.mood) +
      (6 - parseInt(inputs.stress));
    const avg = total / 5;
    setScore(avg.toFixed(1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen px-6 py-10 space-y-10 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <Helmet>
        <title>Recovery Module | Health's Spot</title>
        <meta
          name="description"
          content="Αξιολόγηση Ανάρρωσης με ερωτηματολόγιο και υπολογισμό score στο Health's Spot."
        />
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-yellow-400">Recovery Station</h1>
        <button
          onClick={toggleTheme}
          className="text-sm px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
        >
          {theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        <h2 className="text-xl font-semibold">Self-Report Ερωτηματολόγιο</h2>
        {Object.entries(inputs).map(([key, val]) => (
          <div key={key} className="space-y-2">
            <label className="capitalize block font-medium">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={val}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full accent-blue-500"
            />
            <div className="text-sm text-gray-400">
              Τρέχουσα τιμή: {val}
            </div>
          </div>
        ))}

        <button
          onClick={calculateRecovery}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Υπολόγισε Recovery Score
        </button>

        {score && (
          <p className="mt-4 text-lg">
            Recovery Score: <span className="font-bold">{score}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
