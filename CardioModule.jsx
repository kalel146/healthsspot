import React, { useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";

export default function CardioModule() {
  const [mets, setMets] = useState(1);
  const [weight, setWeight] = useState(70);
  const [duration, setDuration] = useState(30);
  const [kcal, setKcal] = useState(null);

  const [testType, setTestType] = useState("Cooper");
  const [distance, setDistance] = useState(2400);
  const [vo2max, setVo2max] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const calculateKcal = () => {
    const vo2 = mets * 3.5 * weight; // mL/min
    const kcalPerMin = (vo2 * 5) / 1000;
    const total = kcalPerMin * duration;
    setKcal({ vo2: vo2.toFixed(1), total: total.toFixed(1) });
  };

  const calculateVO2max = () => {
    let result = 0;
    if (testType === "Cooper") {
      result = (distance - 504.9) / 44.73;
    }
    setVo2max(result.toFixed(1));
  };

  const inputClass = `p-2 rounded w-full ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen px-6 py-10 space-y-10 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      <Helmet>
        <title>Cardio Module | Health's Spot</title>
        <meta name="description" content="Υπολόγισε METs, VO2max και θερμίδες στο Cardio Lab του Health’s Spot." />
        <meta name="keywords" content="cardio, vo2max, calories, fitness, METs" />
        <html lang="el" />
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400">Cardio Lab</h1>
        <button
          onClick={toggleTheme}
          className="px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
          title="Εναλλαγή Θέματος"
        >
          {theme === "dark" ? "☀" : "🌙"}
        </button>
      </div>

      {/* METs to kcal */}
      <section className="space-y-4 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold">Υπολογισμός kcal μέσω METs ➝ VO2 ➝ kcal</h2>

        <label htmlFor="mets" className="block text-sm font-medium">METs</label>
        <input id="mets" type="number" value={mets} onChange={(e) => setMets(e.target.value)} className={inputClass} />

        <label htmlFor="weight" className="block text-sm font-medium">Βάρος (kg)</label>
        <input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />

        <label htmlFor="duration" className="block text-sm font-medium">Διάρκεια (λεπτά)</label>
        <input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} />

        <button onClick={calculateKcal} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
          Υπολόγισε kcal
        </button>
        {kcal && (
          <p>
            VO2: {kcal.vo2} mL/min | kcal: {kcal.total} kcal συνολικά
          </p>
        )}
      </section>

      {/* VO2max Tests */}
      <section className="space-y-4 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold">VO2max Test</h2>

        <label htmlFor="vo2test" className="block text-sm font-medium">Επιλογή Τεστ VO2max</label>
        <select
          id="vo2test"
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
          className={inputClass}
        >
          <option value="Cooper">Cooper Test</option>
          <option value="Rockport" disabled>Rockport (υπό ανάπτυξη)</option>
          <option value="Step" disabled>Step Test (υπό ανάπτυξη)</option>
        </select>

        {testType === "Cooper" && (
          <>
            <label htmlFor="cooper-distance" className="block text-sm font-medium">Απόσταση σε μέτρα (12 λεπτά)</label>
            <input
              id="cooper-distance"
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="π.χ. 2400"
              className={inputClass}
            />
          </>
        )}

        <button onClick={calculateVO2max} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Υπολόγισε VO2max
        </button>

        {vo2max && <p>VO2max: {vo2max} mL/kg/min</p>}
      </section>
    </motion.div>
  );
}
