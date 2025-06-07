import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import logo from "./assets/logo.png";
import AdvancedMetrics from "./components/AdvancedMetrics";
import Particles from "react-tsparticles";
import { tsParticles } from "tsparticles-engine";
import { loadFull } from "tsparticles";

const modules = [
  { icon: "🏋️", name: "Power", path: "/training", color: "bg-purple-600" },
  { icon: "🏃", name: "Cardio", path: "/cardio", color: "bg-red-500" },
  { icon: "🍎", name: "Nutrition", path: "/nutrition", color: "bg-green-500" },
  { icon: "😌", name: "Recovery", path: "/recovery", color: "bg-blue-500" },
  { icon: "📄", name: "Export", path: "/export", color: "bg-orange-500" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, []);

  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className={`min-h-screen px-2 md:px-8 py-6 flex flex-col md:flex-row items-start gap-8 transition-colors duration-500 ease-in-out relative overflow-hidden ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white"
          : "bg-gradient-to-br from-white via-slate-100 to-gray-200 text-black"
      }`}
    >
      {/* Particle FX */}
      <div className="absolute inset-0 -z-10">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={{
            fullScreen: false,
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            interactivity: {
              detectsOn: "canvas",
              events: { onHover: { enable: true, mode: "repulse" }, resize: true },
              modes: { repulse: { distance: 50, duration: 0.4 } },
            },
            particles: {
              number: { value: 120, density: { enable: true, area: 900 } },
              color: { value: ["#00f6ff", "#f0f0f0", "#f97316"] },
              shape: { type: "circle" },
              opacity: { value: 0.6, random: true, anim: { enable: true, speed: 0.4, opacity_min: 0.1, sync: false } },
              size: { value: { min: 2, max: 4 }, anim: { enable: true, speed: 1, size_min: 0.3 } },
              move: { enable: true, speed: 0.3, direction: "none", random: true, outModes: "out" },
            },
            detectRetina: true,
          }}
        />
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-1/5 flex flex-col gap-3 mt-4 md:mt-12 pl-2 text-left">
        <div className="text-yellow-300 font-bold text-xl mb-3 pl-2">FIT MENU</div>
        {modules.map((mod) => (
          <button
            key={mod.name}
            onClick={() => navigate(mod.path)}
            className="flex items-center gap-2 text-base font-semibold hover:scale-105 transition-transform bg-black/30 px-3 py-2 rounded-lg hover:bg-black/50 shadow"
          >
            <span className="text-xl">{mod.icon}</span>
            <span>{mod.name}</span>
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-6xl flex flex-col">
        <div className="flex w-full justify-between items-start px-2 md:px-4">
          <div className="text-left space-y-1">
            <h1 className="text-2xl font-bold text-yellow-400 drop-shadow-sm">👋 Καλώς ήρθες στο Health’s Spot!</h1>
            <p className="text-sm text-white/80">📊 Δες εβδομαδιαία εξέλιξη στα γραφήματα.</p>
          </div>
          <div className="text-right">
            <span className="text-yellow-400 font-bold text-lg animate-flame">🔥 Install App</span>
          </div>
        </div>

        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold text-yellow-400 drop-shadow mt-6 text-center"
        >
          FITNESS MENU
        </motion.h2>

        <div className="flex flex-col lg:flex-row gap-8 mt-10">
          <div className="flex-1 flex flex-col gap-6">
            <AdvancedMetrics />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/report")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-lg font-bold py-3 px-8 rounded shadow hover:scale-105 transition"
            >
              📜 Create Report
            </motion.button>
          </div>

          <div className="w-full lg:w-1/3 grid grid-cols-1 gap-4 items-start">
            <Card label="BMR / TDEE" value="2400 kcal" theme={theme} />
            <Card label="1RM (Brzycki)" value="145 kg" theme={theme} />
            <Card label="VO2max" value="52 ml/kg/min" theme={theme} />
            <Card label="Stress / Recovery" value="Moderate" theme={theme} />
            <Card label="Nutrition Target" value="P:180g | C:320g | F:70g" theme={theme} />
            <Card label="Τελευταίες 5 Μετρήσεις" value="See history" theme={theme} />
          </div>
        </div>
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
      className={`px-4 py-3 rounded-lg shadow-md flex flex-col items-center justify-center text-center text-sm font-semibold space-y-1 border border-yellow-400/20 ${
        theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
      }`}
    >
      <div className="text-xs text-gray-400 dark:text-gray-300 font-medium tracking-wide">{label}</div>
      <div className="text-lg font-bold mt-1 tracking-tight text-yellow-300">{value}</div>
    </motion.div>
  );
}
