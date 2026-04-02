import React, { useMemo, useState } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

const defaultInputs = {
  sleep: 3,
  energy: 3,
  pain: 3,
  mood: 3,
  stress: 3,
};

const labels = {
  sleep: "Ύπνος",
  energy: "Ενέργεια",
  pain: "Μυϊκός Πόνος",
  mood: "Διάθεση",
  stress: "Στρες",
};

export default function RecoveryModule() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [score, setScore] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const handleChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const handleReset = () => {
    setInputs(defaultInputs);
    setScore(null);
  };

  const calculateRecovery = () => {
    const adjustedPain = 6 - Number(inputs.pain);
    const adjustedStress = 6 - Number(inputs.stress);

    const total =
      Number(inputs.sleep) +
      Number(inputs.energy) +
      adjustedPain +
      Number(inputs.mood) +
      adjustedStress;

    const avg = total / 5;
    setScore(avg.toFixed(1));
  };

  const scoreMessage = useMemo(() => {
    if (score === null) return "";
    const numeric = Number(score);

    if (numeric >= 4.2) {
      return "✅ Πολύ καλή εικόνα αποκατάστασης.";
    }
    if (numeric >= 3.2) {
      return "🟡 Μέτρια εικόνα αποκατάστασης — παρακολούθησέ το.";
    }
    return "🔻 Χαμηλή αποκατάσταση — ίσως χρειάζεται χαμήλωμα έντασης ή περισσότερη ξεκούραση.";
  }, [score]);

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
            <label className="block font-medium">{labels[key]}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={val}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full accent-blue-500"
            />
            <div className="text-sm text-gray-400">Τρέχουσα τιμή: {val}</div>
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={calculateRecovery}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Υπολόγισε Recovery Score
          </button>

          <button
            onClick={handleReset}
            className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded text-white"
          >
            Reset
          </button>
        </div>

        {score && (
          <div className="mt-4 space-y-2">
            <p className="text-lg">
              Recovery Score: <span className="font-bold">{score}</span>
            </p>
            <p className="text-sm text-gray-400">{scoreMessage}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}