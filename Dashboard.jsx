import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import logo from "./assets/logo.png";
import AdvancedMetrics from "./components/AdvancedMetrics"; // ΝΕΟ COMPONENT

const modules = [
  { name: "Strength", path: "/training" },
  { name: "Cardio", path: "/cardio" },
  { name: "Nutrition", path: "/nutrition" },
  { name: "Recovery", path: "/recovery" },
  { name: "Export", path: "/export" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen px-4 md:px-8 py-10 flex flex-col items-center space-y-10 transition-all duration-300 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Sticky Top Bar */}
      <div className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-black shadow-md">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="logo" className="w-6 h-6 rounded" />
          <span className="text-yellow-400 font-bold text-lg">Health's Spot</span>
        </div>

        <div className="hidden md:flex gap-2">
          {modules.map((mod) => (
            <button
              key={mod.name}
              onClick={() => navigate(mod.path)}
              className="text-sm font-medium px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white shadow"
            >
              {mod.name}
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="text-sm px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
        >
          {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="pt-24 w-full flex flex-col items-center space-y-10">
        <h1 className="text-4xl font-bold text-yellow-400">Dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          <Card label="BMR / TDEE" value="2400 kcal" theme={theme} />
          <Card label="1RM (Brzycki)" value="145 kg" theme={theme} />
          <Card label="VO2max" value="52 ml/kg/min" theme={theme} />
          <Card label="Stress / Recovery" value="Moderate" theme={theme} />
          <Card label="Nutrition Target" value="P:180g | C:320g | F:70g" theme={theme} />
          <Card label="Τελευταίες 5 Μετρήσεις" value="See history" theme={theme} />
        </div>

        {/* Advanced Metrics Section */}
        <div className="w-full max-w-6xl">
          <AdvancedMetrics />
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-10">
          {modules.map((mod) => (
            <button
              key={mod.name}
              onClick={() => navigate(mod.path)}
              className="bg-gradient-to-r from-gray-700 via-gray-900 to-black text-white px-6 py-3 rounded text-lg font-semibold shadow hover:scale-105 transition"
            >
              {mod.name} Module
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("/report")}
          className="bg-yellow-500 hover:bg-yellow-600 text-black text-lg font-bold py-3 px-8 rounded mt-6 shadow hover:scale-105 transition"
        >
          📝 Create Report
        </button>
      </div>
    </motion.div>
  );
}

function Card({ label, value, theme }) {
  return (
    <div
      className={`p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center ${
        theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="text-sm text-gray-400 dark:text-gray-300">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
