import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import Card from "./components/Card";

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === "dark" ? "Light" : "Dark";

  const modules = [
    { name: "Strength", path: "/training" },
    { name: "Cardio", path: "/cardio" },
    { name: "Nutrition", path: "/nutrition" },
    { name: "Recovery", path: "/recovery" },
    { name: "Export", path: "/export" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="min-h-screen bg-black text-white px-6 py-10 flex flex-col items-center space-y-10">
        <h1 className="text-4xl font-bold text-yellow-400">Dashboard</h1>
        <button onClick={toggleTheme} aria-label="Toggle Theme">
          Switch to {themeLabel} Mode
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
          {/* Summary Cards */}
          <Card label="BMR / TDEE" value="2400 kcal" />
          <Card label="1RM (Brzycki)" value="145 kg" />
          <Card label="VO2max" value="52 ml/kg/min" />
          <Card label="Stress / Recovery" value="Moderate" />
          <Card label="Nutrition Target" value="P:180g | C:320g | F:70g" />
          <Card label="Τελευταίες 5 Μετρήσεις" value="See history" />
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-10">
          {modules.map((mod) => (
            <button
              key={mod.name}
              onClick={() => navigate(mod.path)}
              className="bg-gradient-to-r from-gray-700 via-gray-900 to-black text-white px-6 py-3 rounded-xl text-lg font-semibold hover:scale-105 transition"
              aria-label={`Go to ${mod.name} module`}
            >
              {mod.name} Module
            </button>
          ))}

          <div className="pt-6">
            <button
              onClick={() => navigate("/report")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-lg font-bold py-3 px-8 rounded-xl shadow hover:scale-105 transition"
              aria-label="Generate PDF report"
            >
              📋 Create Report
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
