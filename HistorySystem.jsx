import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";

export default function HistorySystem() {
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("healths_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [entry, setEntry] = useState("");
  const { theme, toggleTheme } = useTheme();

  const addEntry = () => {
    if (!entry.trim()) return;
    const newEntry = {
      text: entry,
      date: new Date().toLocaleString(),
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem("healths_history", JSON.stringify(updated));
    setEntry("");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("healths_history");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className={`min-h-screen px-6 py-10 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">
        Ιστορικό Καταγραφών
      </h1>

      <button
        onClick={toggleTheme}
        className="block mx-auto text-sm mb-6 underline hover:text-yellow-400"
      >
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </button>

      <div className="space-y-4">
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Προσθήκη νέας καταγραφής..."
          className={`w-full p-4 rounded resize-none h-32 ${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
          }`}
        ></textarea>

        <div className="flex gap-4">
          <button
            onClick={addEntry}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold text-white"
          >
            Αποθήκευση
          </button>
          <button
            onClick={clearHistory}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold text-white"
          >
            Καθαρισμός Όλων
          </button>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        {history.length === 0 ? (
          <p className="text-gray-400 text-center">Δεν υπάρχουν καταγραφές.</p>
        ) : (
          history.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded shadow ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-200"
              }`}
            >
              <p className="text-sm text-gray-500">{item.date}</p>
              <p>{item.text}</p>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
