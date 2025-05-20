import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen px-6 py-10 flex flex-col items-center space-y-10 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <h1 className="text-4xl font-bold text-yellow-400">Dashboard</h1>

      <button
        onClick={toggleTheme}
        className="text-sm underline hover:text-yellow-400 absolute top-4 right-4"
      >
        Switch to {theme === "dark" ? "Light" : "Dark"} Mode
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
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
            className="bg-gradient-to-r from-gray-700 via-gray-900 to-black text-white px-6 py-3 rounded text-lg font-semibold"
          >
            {mod.name} Module
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate("/report")}
        className="bg-yellow-500 hover:bg-yellow-600 text-black text-lg font-bold py-3 px-8 rounded mt-6"
      >
        📝 Create Report
      </button>
    </motion.div>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-md flex flex-col items-center justify-center">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-xl font-bold text-white mt-1">{value}</div>
    </div>
  );
}
