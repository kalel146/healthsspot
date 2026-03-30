import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import logo from "./assets/logo.png";
import AdvancedMetrics from "./components/AdvancedMetrics";
import { useSwipeable } from "react-swipeable";
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";

function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    setIsPWA(standalone);
  }, []);

  return isPWA;
}

function UpgradeModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-[90%] max-w-sm rounded-2xl border border-yellow-400/30 bg-zinc-900 p-6 text-white shadow-2xl"
      >
        <h2 className="mb-2 text-xl font-bold text-yellow-400">🚀 Upgrade Required</h2>
        <p className="mb-4 text-sm text-zinc-200">
          Αυτό το feature είναι διαθέσιμο μόνο για PRO ή ELITE μέλη. Αναβάθμισε για να αποκτήσεις πλήρη πρόσβαση.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600"
          >
            Άκυρο
          </button>
          <button
            onClick={() => window.open("/upgrade", "_self")}
            className="rounded-lg bg-yellow-500 px-4 py-1 text-sm font-semibold text-black hover:bg-yellow-400"
          >
            Αναβάθμιση
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function MobileDashboard({ user }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userLevel, setUserLevel] = useState("basic");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const level = user?.publicMetadata?.userLevel || "basic";
    setUserLevel(level);
  }, [user]);

  const tabs = [
    { key: "dashboard", icon: userLevel === "basic" ? "🏠" : "🔥", label: "Home", badge: 0 },
    { key: "metrics", icon: userLevel === "basic" ? "📊" : "🧬", label: "Metrics", badge: 3 },
    ...(userLevel !== "basic" ? [{ key: "insights", icon: "🧠", label: "Insights", badge: 0 }] : []),
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
        return (
          <motion.div key="dashboard" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            🏠 Dashboard view
          </motion.div>
        );
      case "metrics":
        return (
          <motion.div key="metrics" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            📊 Metrics view
          </motion.div>
        );
      case "insights":
        return userLevel === "basic" ? (
          setShowUpgradeModal(true)
        ) : (
          <motion.div key="insights" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            📈 Insights view
          </motion.div>
        );
      case "settings":
        return (
          <motion.div key="settings" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            ⚙️ Settings view
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-white">
      <div className="p-6 text-center text-sm" {...swipeHandlers}>
        <h1 className="mb-2 text-xl font-bold">📱 Mobile App Mode</h1>
        <p className="mb-4">
          Welcome to the installed version of <strong>Health&apos;s Spot</strong>!
        </p>
        <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
      </div>

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      <nav className="fixed bottom-3 left-1/2 z-50 flex w-[90%] max-w-sm -translate-x-1/2 justify-between rounded-full bg-zinc-900/80 px-4 py-2 shadow-xl backdrop-blur-xl">
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
            className={`relative flex flex-col items-center px-3 py-1 text-xs transition duration-300 ${
              activeTab === tab.key ? "scale-110 text-yellow-400" : "text-white"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.badge > 0 && (
              <span className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600 px-1.5 text-[10px] text-white">
                {tab.badge}
              </span>
            )}
            <span className="mt-0.5 text-[10px]">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function Surface({ theme, children, className = "", accent = false }) {
  return (
    <div
      className={`rounded-[28px] backdrop-blur-sm transition-colors duration-300 ${
        theme === "dark"
          ? `border border-white/6 bg-slate-950/72 text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)] ${accent ? "ring-1 ring-yellow-400/8" : ""}`
          : `border border-slate-200/70 bg-white/84 text-slate-900 shadow-[0_20px_60px_rgba(148,163,184,0.16)] ${accent ? "ring-1 ring-yellow-500/8" : ""}`
      } ${className}`}
    >
      {children}
    </div>
  );
}

function Pill({ theme, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
        theme === "dark"
          ? "border-yellow-400/25 bg-yellow-400/10 text-yellow-300"
          : "border-yellow-500/30 bg-yellow-100 text-yellow-700"
      }`}
    >
      {children}
    </span>
  );
}

function MicroSignal({ theme, label, value, helper }) {
  return (
    <div
      className={`rounded-2xl p-3 ${
        theme === "dark"
          ? "bg-white/[0.035] ring-1 ring-inset ring-white/6"
          : "bg-slate-50/90 ring-1 ring-inset ring-slate-200/70"
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-bold text-yellow-400">{value}</div>
      <div className={`mt-1 text-[11px] leading-5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{helper}</div>
    </div>
  );
}

function StatCard({ title, value, subtitle, theme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className={`rounded-2xl p-4 ${
        theme === "dark"
          ? "bg-slate-900/78 ring-1 ring-inset ring-white/6"
          : "bg-slate-50/92 ring-1 ring-inset ring-slate-200/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</div>
        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${theme === "dark" ? "bg-yellow-400/90" : "bg-yellow-500"}`} />
      </div>
      <div className="mt-3 text-xl font-black text-yellow-400">{value}</div>
      <div className={`mt-1 text-xs leading-5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</div>
    </motion.div>
  );
}

function QuickAction({ label, sublabel, icon, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      className={`group flex min-h-[88px] items-start gap-3 rounded-2xl p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
        theme === "dark"
          ? "bg-slate-900/72 ring-1 ring-inset ring-white/6 hover:ring-yellow-400/16 hover:bg-slate-900/84"
          : "bg-slate-50/92 ring-1 ring-inset ring-slate-200/70 hover:ring-yellow-500/18 hover:bg-white"
      }`}
    >
      <div className="text-xl leading-none">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-bold">{label}</div>
        <div className={`mt-1 text-xs leading-5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{sublabel}</div>
      </div>
      <div className={`text-sm transition group-hover:translate-x-0.5 ${theme === "dark" ? "text-yellow-400" : "text-yellow-600"}`}>→</div>
    </button>
  );
}

function SectionEyebrow({ children }) {
  return <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{children}</div>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, isLoaded } = useUser();
  const isPWA = useIsPWA();
  const [showTip, setShowTip] = useState(() => localStorage.getItem("hideDashboardTip") !== "true");

  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  const handleGotIt = () => setShowTip(false);
  const handleHideForever = () => {
    localStorage.setItem("hideDashboardTip", "true");
    setShowTip(false);
  };

  useEffect(() => {
    document.title = "Health's Spot | FIT MENU";

    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = "FIT MENU dashboard for health metrics, performance and nutrition overview.";
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);

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
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-800">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <img src={logo} alt="Health's Spot Logo" className="mx-auto mb-4 h-24 w-24" />
          <h1 className="mb-2 text-2xl font-bold">Welcome to Health&apos;s Spot</h1>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
          <button
            onClick={() => navigate("/sign-in")}
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === "giannis@admin.dev";
  const userLevel = "admin";

  if (userLevel === "basic") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-800">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold">👋 Welcome, {user.firstName || "User"}!</h1>
          <p className="text-lg">
            Είσαι έτοιμος να εξερευνήσεις το Health’s Spot. Αναβάθμισε για πλήρη πρόσβαση ή ξεκίνα με βασικές δυνατότητες.
          </p>
          <div className="mt-6 space-x-4">
            <button
              onClick={() => navigate("/programs")}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Δες τα Προγράμματα
            </button>
            <button
              onClick={() => navigate("/upgrade")}
              className="rounded bg-yellow-400 px-4 py-2 text-black hover:bg-yellow-300"
            >
              Αναβάθμιση
            </button>
          </div>
        </div>
      </div>
    );
  }

  const summaryCards = useMemo(
    () => [
      { title: "BMR / TDEE", value: "2400 kcal", subtitle: "Current daily energy reference" },
      { title: "1RM (Brzycki)", value: "145 kg", subtitle: "Top strength marker" },
      { title: "VO₂max", value: "52 ml/kg/min", subtitle: "Cardiorespiratory profile" },
      { title: "Stress / Recovery", value: "Moderate", subtitle: "Weekly recovery signal" },
      { title: "Nutrition Target", value: "P180 · C320 · F70", subtitle: "Active macro setup" },
      { title: "Recent Measurements", value: "5 entries", subtitle: "Latest captured records" },
    ],
    []
  );

  const quickActions = [
    { label: "Nutrition", sublabel: "Macros, targets και meal planning", icon: "🍎", path: "/nutrition" },
    { label: "Cardio", sublabel: "VO₂, trends και endurance view", icon: "🏃", path: "/cardio" },
    { label: "Power", sublabel: "Strength markers και loading logic", icon: "🏋️", path: "/power" },
    { label: "Export", sublabel: "Reports, history και sharing", icon: "📄", path: "/report" },
  ];

  const microSignals = [
    { label: "Command", value: "FIT MENU", helper: "One home for performance, recovery and nutrition oversight." },
    { label: "Workflow", value: "Fast access", helper: "Jump straight into the modules that actually move the numbers." },
    { label: "Discipline", value: "Weekly logging", helper: "Good dashboard, bad data = expensive decoration. Feed it consistently." },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className={`relative min-h-screen overflow-x-hidden px-2 py-5 transition-colors duration-500 sm:px-4 md:px-6 xl:px-8 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white"
          : "bg-gradient-to-br from-white via-slate-100 to-slate-200 text-black"
      }`}
    >
      {user?.publicMetadata?.userLevel === "basic" && !isAdmin && <UpgradeModal onClose={() => null} />}

      <div className="pointer-events-none absolute inset-0 -z-10">
        <Particles
          id="dashboard-particles"
          init={particlesInit}
          options={{
            fullScreen: false,
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            interactivity: {
              detectsOn: "canvas",
              events: { onHover: { enable: true, mode: "repulse" }, resize: true },
              modes: { repulse: { distance: 36, duration: 0.25 } },
            },
            particles: {
              number: { value: 34, density: { enable: true, area: 1200 } },
              color: { value: ["#facc15", "#60a5fa", "#ffffff"] },
              shape: { type: "circle" },
              opacity: { value: 0.14, random: true },
              size: { value: { min: 1, max: 2.4 } },
              move: { enable: true, speed: 0.16, direction: "none", random: true, outModes: "out" },
            },
            detectRetina: true,
          }}
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_0.95fr]">
          <Surface theme={theme} accent className="relative overflow-hidden p-6 md:p-8">
            <div className={`absolute inset-0 opacity-70 ${theme === "dark" ? "bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_34%)]" : "bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%)]"}`} />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2">
                <Pill theme={theme}>FIT MENU</Pill>
                <Pill theme={theme}>Premium View</Pill>
                <Pill theme={theme}>Private Metrics</Pill>
              </div>

              <div className="max-w-3xl">
                <h1 className="text-3xl font-black tracking-tight text-yellow-400 md:text-5xl">
                  It&apos;s ON, {user?.firstName || "Athlete"}
                </h1>
                <p className={`mt-3 max-w-2xl text-sm leading-7 md:text-base ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                  Το FIT MENU είναι το κεντρικό command room σου για performance markers, nutrition setup,
                  recovery signal και γρήγορη μετάβαση στα modules χωρίς dashboard-σαλάτα και διακοσμητικές ανοησίες.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/report")}
                  className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
                >
                  📜 Create Report
                </button>
                <button
                  onClick={() => navigate("/nutrition")}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    theme === "dark"
                      ? "bg-slate-900/68 text-white ring-1 ring-inset ring-white/8 hover:ring-yellow-400/20"
                      : "bg-white/82 text-slate-900 ring-1 ring-inset ring-slate-200/80 hover:ring-yellow-500/20"
                  }`}
                >
                  🍎 Open Nutrition
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {microSignals.map((item) => (
                  <MicroSignal
                    key={item.label}
                    theme={theme}
                    label={item.label}
                    value={item.value}
                    helper={item.helper}
                  />
                ))}
              </div>
            </div>
          </Surface>

          <Surface theme={theme} className="p-5 md:p-6">
            <div className="flex h-full flex-col gap-4">
              <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                <div>
                  <SectionEyebrow>Readiness</SectionEyebrow>
                  <div className="mt-2 text-4xl font-black text-yellow-400">100%</div>
                  <div className={`mt-1 text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Premium overview active
                  </div>
                </div>
                <div className={`rounded-2xl px-4 py-3 text-right ${theme === "dark" ? "bg-slate-900/72 ring-1 ring-inset ring-white/6" : "bg-slate-50/90 ring-1 ring-inset ring-slate-200/70"}`}>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tier</div>
                  <div className="mt-1 text-lg font-bold">{isAdmin ? "Admin" : "Pro"}</div>
                </div>
              </div>

              <div className={`h-2 w-full overflow-hidden rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`}>
                <div className="h-full w-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MicroSignal theme={theme} label="Status" value="Ready" helper="Modules armed, shortcuts clean, dashboard stable." />
                <MicroSignal theme={theme} label="Focus" value="Metrics first" helper="Weekly entries decide whether this view helps or lies." />
              </div>

              {showTip ? (
                <div className={`rounded-2xl p-4 ${theme === "dark" ? "bg-slate-900/68 ring-1 ring-inset ring-yellow-400/14" : "bg-yellow-50/90 ring-1 ring-inset ring-yellow-500/18"}`}>
                  <div className="text-sm font-bold text-yellow-400">💡 FIT MENU Tip</div>
                  <p className={`mt-2 text-xs leading-6 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                    Πρόσθεσε BMR, VO₂max, macros και stress metrics σταθερά. Το dashboard είναι χρήσιμο μόνο όταν το τροφοδοτείς. Άδειο dashboard = ωραίο ψέμα.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={handleGotIt}
                      className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-yellow-400"
                    >
                      ✅ Thanks
                    </button>
                    <button
                      onClick={handleHideForever}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                        theme === "dark"
                          ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      ❌ Don&apos;t show again
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl p-4 text-sm ${theme === "dark" ? "bg-slate-900/68 text-slate-300 ring-1 ring-inset ring-white/6" : "bg-slate-50/85 text-slate-600 ring-1 ring-inset ring-slate-200/70"}`}>
                  Guidance hidden. Καλό σημάδι — σημαίνει ότι δεν χρειάζεσαι training wheels.
                </div>
              )}
            </div>
          </Surface>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              subtitle={card.subtitle}
              theme={theme}
            />
          ))}
        </div>

        <Surface theme={theme} accent className="p-4 md:p-5 xl:p-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <SectionEyebrow>Performance analytics</SectionEyebrow>
              <h2 className="mt-1 text-2xl font-black text-yellow-400 md:text-3xl">FIT MENU Metrics Lab</h2>
              <p className={`mt-2 max-w-3xl text-sm leading-7 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                Εδώ ζει το πραγματικό dashboard: trends, macro profile, stress curve και weekly metric capture.
                Πρώτα καθαρά δεδομένα, μετά συμπεράσματα. Όχι το ανάποδο σαν τηλεοπτικό πάνελ.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickActions.map((action) => (
                <QuickAction
                  key={action.label}
                  label={action.label}
                  sublabel={action.sublabel}
                  icon={action.icon}
                  onClick={() => navigate(action.path)}
                  theme={theme}
                />
              ))}
            </div>
          </div>

          <div className={`mt-5 rounded-[24px] p-3 md:p-4 ${theme === "dark" ? "bg-black/22 ring-1 ring-inset ring-white/6" : "bg-white/72 ring-1 ring-inset ring-slate-200/70"}`}>
            <AdvancedMetrics />
          </div>
        </Surface>
      </div>
    </motion.div>
  );
}
