import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import logo from "./assets/logo.png";
import AdvancedMetrics from "./components/AdvancedMetrics";
import Particles from "react-tsparticles";
import { tsParticles } from "tsparticles-engine";
import { loadFull } from "tsparticles";
import { useSwipeable } from "react-swipeable";

function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsPWA(standalone);
  }, []);

  return isPWA;
}

function MobileDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userLevel, setUserLevel] = useState("basic"); // mock level, change as needed

  const tabs = [
    { key: "dashboard", icon: userLevel === "basic" ? "🏠" : "🔥", label: "Home", badge: 0 },
    { key: "metrics", icon: userLevel === "basic" ? "📊" : "🧬", label: "Metrics", badge: 3 },
    ...(userLevel !== "basic"
      ? [{ key: "insights", icon: "🧠", label: "Insights", badge: 0 }]
      : []),
    { key: "settings", icon: "⚙️", label: "Settings", badge: 1 },
  ];

  const tabVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  const tabIndex = tabs.findIndex((t) => t.key === activeTab);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (tabIndex < tabs.length - 1) setActiveTab(tabs[tabIndex + 1].key);
    },
    onSwipedRight: () => {
      if (tabIndex > 0) setActiveTab(tabs[tabIndex - 1].key);
    },
    trackTouch: true,
    trackMouse: true,
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <motion.div key="dashboard" variants={tabVariants} initial="initial" animate="animate" exit="exit">🏠 Dashboard view</motion.div>;
      case "metrics":
        return <motion.div key="metrics" variants={tabVariants} initial="initial" animate="animate" exit="exit">📊 Metrics view</motion.div>;
      case "insights":
        return <motion.div key="insights" variants={tabVariants} initial="initial" animate="animate" exit="exit">📈 Insights view</motion.div>;
      case "settings":
        return <motion.div key="settings" variants={tabVariants} initial="initial" animate="animate" exit="exit">⚙️ Settings view</motion.div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white">
      <div className="p-6 text-center text-sm" {...swipeHandlers}>
        <h1 className="text-xl font-bold mb-2">📱 Mobile App Mode</h1>
        <p className="mb-4">Welcome to the installed version of <strong>Health's Spot</strong>!</p>
        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-xl rounded-full px-4 py-2 shadow-xl flex justify-between w-[90%] max-w-sm z-50">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex flex-col items-center px-3 py-1 text-xs transition duration-300 ${activeTab === tab.key ? "text-yellow-400 scale-110" : "text-white"}`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.badge > 0 && (
              <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] rounded-full px-1.5">
                {tab.badge}
              </span>
            )}
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useUser();
  const isPWA = useIsPWA();

  const [showTip, setShowTip] = useState(() => {
    return localStorage.getItem("hideDashboardTip") !== "true";
  });

  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, []);

  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  const handleGotIt = () => {
    setShowTip(false);
  };

  const handleHideForever = () => {
    localStorage.setItem("hideDashboardTip", "true");
    setShowTip(false);
  };

  if (isPWA) {
    return <MobileDashboard user={user} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className={`min-h-screen px-2 md:px-4 py-6 flex flex-col items-start gap-8 transition-colors duration-500 ease-in-out relative overflow-visible ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white" : "bg-gradient-to-br from-white via-slate-100 to-gray-200 text-black"}`}
    >
      {/* Particle FX */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
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

      {/* Main Content */}
      <div className="flex-1 w-full max-w-7xl flex flex-col mx-auto items-center">
        <div className="flex w-full justify-between items-start px-4 md:px-10 lg:px-20 xl:px-32 2xl:px-40 max-w-6xl">
          <div className="text-left space-y-1">
            <h1 className="text-2xl font-bold text-yellow-400 drop-shadow-sm">
              It's ON, {user?.firstName || "Athlete"}, 💯%
            </h1>
          </div>
          <div className="text-right">
            <span className="text-yellow-400 font-bold text-lg animate-flame">🥇 PLACE</span>
          </div>
        </div>

        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className={`mt-4 p-3 text-xs rounded-lg shadow-lg border border-yellow-400 max-w-md z-50 relative self-center ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}
          >
            <h3 className="text-sm font-bold text-yellow-400 mb-1">💡 Tip</h3>
            <p className="text-xs">➕ Πρόσθεσε μετρήσεις BMR, VO₂max, macros, stress. 🚀 Δες εβδομαδιαία εξέλιξη στα γραφήματα. 🦖 Τα δεδομένα σου είναι ορατά μόνο σε εσένα.</p>
            <div className="flex gap-3 mt-3">
              <button onClick={handleGotIt} className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold px-2 py-1 rounded z-50">
                ✅ Thanks
              </button>
              <button onClick={handleHideForever} className="bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold px-2 py-1 rounded z-50">
                ❌ Don't show this again
              </button>
            </div>
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-3xl font-bold text-yellow-400 drop-shadow mt-6 text-center"
        >
          FITNESS MENU
        </motion.h2>

        <div className="flex flex-col lg:flex-row gap-4 mt-4 justify-center items-start">
          <div className="flex flex-col gap-3 lg:ml-auto w-[180px]">
            <AdvancedMetrics compact smallCharts className="w-full" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/report")}
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-bold py-2 px-5 rounded shadow hover:scale-105 transition"
            >
              📜 Create Report
            </motion.button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mt-4 justify-between items-stretch">
            <div className="flex flex-col gap-6 w-full lg:w-1/3">
              <Card label="BMR / TDEE" value="2400 kcal" theme={theme} />
              <Card label="1RM (Brzycki)" value="145 kg" theme={theme} />
              <Card label="VO2max" value="52 ml/kg/min" theme={theme} />
              <Card label="Stress / Recovery" value="Moderate" theme={theme} />
              <Card label="Nutrition Target" value="P:180g | C:320g | F:70g" theme={theme} />
              <Card label="Τελευταίες 5 Μετρήσεις" value="See history" theme={theme} />
            </div>
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
      className={`h-[110px] w-[180px] px-3 py-4 rounded-lg shadow-md flex flex-col items-center justify-center text-center text-xs font-semibold space-y-1 border border-yellow-400/20 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}
    >
      <div className="text-[11px] text-center leading-tight text-gray-300 dark:text-gray-200 font-medium break-words">
        {label}
      </div>
      <div className="text-[11px] font-bold tracking-tight text-yellow-300 break-words leading-snug text-center">
        {value}
      </div>
    </motion.div>
  );
}
