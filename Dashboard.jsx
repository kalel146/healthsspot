import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import logo from "./assets/logo.png";
import AdvancedMetrics from "./components/AdvancedMetrics";
import { useSwipeable } from "react-swipeable";
import { tsParticles } from "tsparticles-engine";
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";


function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setIsPWA(standalone);
  }, []);

  return isPWA;
}

function UpgradeModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-zinc-900 text-white rounded-xl p-6 w-[90%] max-w-sm shadow-2xl"
      >
        <h2 className="text-xl font-bold mb-2 text-yellow-400">🚀 Upgrade Required</h2>
        <p className="text-sm mb-4">Αυτό το feature είναι διαθέσιμο μόνο για PRO ή ELITE μέλη. Αναβάθμισε για να αποκτήσεις πλήρη πρόσβαση.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 text-sm rounded bg-gray-700 hover:bg-gray-600">Άκυρο</button>
          <button onClick={() => window.open("/upgrade", "_self")} className="px-4 py-1 text-sm rounded bg-yellow-500 text-black font-semibold hover:bg-yellow-400">Αναβάθμιση</button>
        </div>
      </motion.div>
    </div>
  );
}

function MobileDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userLevel, setUserLevel] = useState("basic"); // mock level, change as needed
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
    const level = user?.publicMetadata?.userLevel || "basic";
    setUserLevel(level);
  }, [user]);

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
        return userLevel === "basic"
          ? setShowUpgradeModal(true)
          : <motion.div key="insights" variants={tabVariants} initial="initial" animate="animate" exit="exit">📈 Insights view</motion.div>;
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

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-xl rounded-full px-4 py-2 shadow-xl flex justify-between w-[90%] max-w-sm z-50">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === "insights" && userLevel === "basic") {
                setShowUpgradeModal(true);
              } else {
                setActiveTab(tab.key);
              }
            }}
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
  const { user, isLoaded } = useUser();
  const isPWA = useIsPWA();
 
    const [showTip, setShowTip] = useState(() => {
    return localStorage.getItem("hideDashboardTip") !== "true";
  });
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  const handleGotIt = () => setShowTip(false);
  const handleHideForever = () => {
    localStorage.setItem("hideDashboardTip", "true");
    setShowTip(false);
  };

  useEffect(() => {
    if (window.location.pathname === "/dashboard") {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, []);
  
  if (isPWA) {
    return <MobileDashboard user={user} />;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-800">
        <p>Loading...</p>
      </div>
    );
  }

    if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <img src={logo} alt="Health's Spot Logo" className="w-24 h-24 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Welcome to Health's Spot</h1>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
          <button onClick={() => navigate("/sign-in")} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
            Log In
          </button>
        </div>
      </div>
    );
  }
 const isAdmin = user?.emailAddresses?.[0]?.emailAddress === "giannis@admin.dev";
  const userLevel = "admin"; // 🔥 Full access always

  // Default Welcome Screen for basic users
  if (userLevel === "basic") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">👋 Welcome, {user.firstName || "User"}!</h1>
          <p className="text-lg">Είσαι έτοιμος να εξερευνήσεις το Health’s Spot. Αναβάθμισε για πλήρη πρόσβαση ή ξεκίνα με βασικές δυνατότητες.</p>
          <div className="mt-6 space-x-4">
            <button onClick={() => navigate("/programs")} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Δες τα Προγράμματα</button>
            <button onClick={() => navigate("/upgrade")} className="px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-300">Αναβάθμιση</button>
        </div>
      </div>
    </div>
  );
}

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className={`min-h-screen px-2 md:px-4 py-6 flex flex-col items-start gap-8 transition-colors duration-500 ease-in-out relative overflow-visible ${theme === "dark" ? "bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white" : "bg-gradient-to-br from-white via-slate-100 to-gray-200 text-black"}`}
    >
         <div className="text-center mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 drop-shadow mb-4">🎉 Welcome to your Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-300">Here comes your premium view.</p>
      </div>
 {/* Όλοι βλέπουν το dashboard, αλλά οι μη-admin παίρνουν το upgrade prompt */}
      {(user?.publicMetadata?.userLevel === "basic" && !isAdmin) && (
        <UpgradeModal onClose={() => setShowUpgradePrompt(false)} />
      )}
   
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
}