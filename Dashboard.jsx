import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import logo from "./assets/logo.png";
import AdvancedMetrics from "./components/AdvancedMetrics";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

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

  const particlesInit = async (main) => {
    await loadFull(main);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className={`min-h-screen px-4 md:px-8 py-10 flex flex-col items-center space-y-10 transition-colors duration-500 ease-in-out relative overflow-hidden ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white"
          : "bg-gradient-to-br from-white via-slate-100 to-gray-200 text-black"
      }`}
    >
      {/* Particle FX */}
      <Particles
        className="absolute inset-0 z-0"
        init={particlesInit}
        options={{
          fullScreen: false,
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 60,
          interactivity: {
            detectsOn: "canvas",
            events: {
              onHover: { enable: true, mode: "repulse" },
              resize: true,
            },
            modes: {
              repulse: { distance: 50, duration: 0.4 },
            },
          },
          particles: {
            number: { value: 80, density: { enable: true, area: 800 } },
            color: { value: ["#00f6ff", "#f0f0f0", "#f97316"] },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.6,
              random: true,
              anim: { enable: true, speed: 0.4, opacity_min: 0.1, sync: false },
            },
            size: {
              value: { min: 1.5, max: 3 },
              anim: { enable: true, speed: 1, size_min: 0.3 },
            },
            move: {
              enable: true,
              speed: 0.2,
              direction: "none",
              random: true,
              outModes: "out",
            },
          },
          detectRetina: true,
        }}
      />

      {/* Top Bar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-black/40 backdrop-blur-md shadow-lg"
      >
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}> 
          <img src={logo} alt="logo" className="w-6 h-6 rounded shadow-sm hover:scale-110 transition duration-300" />
          <span className="text-yellow-400 font-bold text-lg drop-shadow-md">Health's Spot</span>
        </div>

        <div className="text-white text-md md:text-lg font-bold italic">Welcome, Giannis</div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="text-sm px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold shadow"
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌛 Dark Mode"}
        </motion.button>
      </motion.div>

      {/* Bottom Bar */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        className="fixed bottom-0 left-0 w-full z-40 flex justify-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md shadow-inner"
      >
        {modules.map((mod) => (
          <motion.button
            key={mod.name}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={() => navigate(mod.path)}
            className="text-sm font-medium px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white shadow"
          >
            {mod.name}
          </motion.button>
        ))}
      </motion.div>

      <div className="pt-24 w-full flex flex-col items-center space-y-10 relative z-10">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold text-yellow-400 drop-shadow"
        >
          Dashboard
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl"
        >
          <Card label="BMR / TDEE" value="2400 kcal" theme={theme} />
          <Card label="1RM (Brzycki)" value="145 kg" theme={theme} />
          <Card label="VO2max" value="52 ml/kg/min" theme={theme} />
          <Card label="Stress / Recovery" value="Moderate" theme={theme} />
          <Card label="Nutrition Target" value="P:180g | C:320g | F:70g" theme={theme} />
          <Card label="Τελευταίες 5 Μετρήσεις" value="See history" theme={theme} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-6xl"
        >
          <AdvancedMetrics />
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/report")}
          className="bg-yellow-500 hover:bg-yellow-600 text-black text-lg font-bold py-3 px-8 rounded mt-6 shadow hover:scale-105 transition"
        >
          📝 Create Report
        </motion.button>
      </div>
    </motion.div>
  );
}

function Card({ label, value, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`p-6 rounded-xl shadow-md flex flex-col items-center justify-center text-center ${
        theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="text-sm text-gray-400 dark:text-gray-300">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </motion.div>
  );
}
