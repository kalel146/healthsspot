import React, { useState } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";

export default function ExportModule() {
  const [selected, setSelected] = useState({
    strength: true,
    cardio: true,
    nutrition: true,
    recovery: true,
  });
  const [exported, setExported] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const toggleOption = (key) => {
    setSelected({ ...selected, [key]: !selected[key] });
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
      <h1 className="text-3xl font-bold text-yellow-400 text-center">Export & Share</h1>

      <button
        onClick={toggleTheme}
        className="mb-6 text-sm underline hover:text-yellow-400"
      >
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </button>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Επιλογή Περιεχομένου για Εξαγωγή</h2>
        {Object.keys(selected).map((key) => (
          <div key={key} className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selected[key]}
              onChange={() => toggleOption(key)}
              className="h-5 w-5 accent-green-600"
            />
            <label className="capitalize text-lg">{key} data</label>
          </div>
        ))}

        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Δημιουργία PDF
        </button>

        {exported && (
          <p className="text-sm text-gray-400 pt-2">
            ✅ PDF δημιουργήθηκε (mock)
          </p>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Επιλογές Διαμοιρασμού</h2>
        <div className="flex flex-col space-y-3">
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            Αποθήκευση στο κινητό
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded">
            Αποστολή με Email
          </button>
          <button className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded">
            Sync με Cloud
          </button>
        </div>
      </section>
    </motion.div>
  );
}
