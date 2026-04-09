import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser } from "@clerk/clerk-react";
import logo from "./assets/logo.png";
import AdvancedMetrics from "./components/AdvancedMetrics";
import { useSwipeable } from "react-swipeable";
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";

const ADMIN_EMAIL_ALLOWLIST = ["giannis@admin.dev"];

function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia?.("(display-mode: standalone)");
    const update = () => {
      const standalone =
        Boolean(media?.matches) || Boolean(window.navigator?.standalone);
      setIsPWA(standalone);
    };

    update();
    media?.addEventListener?.("change", update);

    return () => {
      media?.removeEventListener?.("change", update);
    };
  }, []);

  return isPWA;
}

function getUserTier(user) {
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase?.() || "";
  const publicRole = String(user?.publicMetadata?.role || "").toLowerCase();
  const unsafeRole = String(user?.unsafeMetadata?.role || "").toLowerCase();
  const publicLevel = String(user?.publicMetadata?.userLevel || "").toLowerCase();
  const unsafeLevel = String(user?.unsafeMetadata?.userLevel || "").toLowerCase();

  if (
    ADMIN_EMAIL_ALLOWLIST.includes(email) ||
    publicRole === "admin" ||
    unsafeRole === "admin" ||
    publicLevel === "admin" ||
    unsafeLevel === "admin"
  ) {
    return "admin";
  }

  return publicLevel || unsafeLevel || "basic";
}

function UpgradeModal({ onClose, onUpgrade }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl border border-yellow-400/20 bg-zinc-950 p-6 text-white shadow-2xl"
      >
        <h2 className="mb-2 text-xl font-black text-yellow-400">🚀 Upgrade Required</h2>
        <p className="mb-5 text-sm leading-7 text-zinc-300">
          Αυτό το feature δεν είναι για basic πρόσβαση. Αν θες πλήρες Health&apos;s Spot και όχι sample platter, θέλει upgrade.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-700"
          >
            Άκυρο
          </button>
          <button
            onClick={onUpgrade}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-400"
          >
            Αναβάθμιση
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Surface({ theme, children, className = "", accent = false }) {
  return (
    <div
      className={`rounded-[28px] backdrop-blur-sm transition-colors duration-300 ${
        theme === "dark"
          ? `border border-white/6 bg-slate-950/72 text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)] ${
              accent ? "ring-1 ring-yellow-400/8" : ""
            }`
          : `border border-slate-200/70 bg-white/84 text-slate-900 shadow-[0_20px_60px_rgba(148,163,184,0.16)] ${
              accent ? "ring-1 ring-yellow-500/8" : ""
            }`
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
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-yellow-400">{value}</div>
      <div
        className={`mt-1 text-[11px] leading-5 ${
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {helper}
      </div>
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
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {title}
        </div>
        <span
          className={`mt-1 h-2.5 w-2.5 rounded-full ${
            theme === "dark" ? "bg-yellow-400/90" : "bg-yellow-500"
          }`}
        />
      </div>
      <div className="mt-3 text-xl font-black text-yellow-400">{value}</div>
      <div
        className={`mt-1 text-xs leading-5 ${
          theme === "dark" ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {subtitle}
      </div>
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
        <div
          className={`mt-1 text-xs leading-5 ${
            theme === "dark" ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {sublabel}
        </div>
      </div>
      <div
        className={`text-sm transition group-hover:translate-x-0.5 ${
          theme === "dark" ? "text-yellow-400" : "text-yellow-600"
        }`}
      >
        →
      </div>
    </button>
  );
}

function SectionEyebrow({ children }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </div>
  );
}

function DashboardAccessGate({ theme, user, onUpgrade, onBrowsePrograms }) {
  return (
    <div
      className={`min-h-screen px-4 py-8 md:px-6 ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white"
          : "bg-gradient-to-br from-white via-slate-100 to-slate-200 text-slate-900"
      }`}
    >
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center">
        <Surface theme={theme} accent className="w-full overflow-hidden p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill theme={theme}>Basic Access</Pill>
                <Pill theme={theme}>Upgrade Path</Pill>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-yellow-400 md:text-5xl">
                Γεια σου, {user?.firstName || "Athlete"}
              </h1>

              <p
                className={`mt-4 max-w-2xl text-sm leading-7 md:text-base ${
                  theme === "dark" ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Η εφαρμογή είναι ανοιχτή, αλλά το πλήρες command room δεν χαρίζεται από default.
                Αν θες πραγματικό dashboard με premium metrics, insights και full module flow,
                θέλει ενεργό plan. Αλλιώς μένεις στο preview lane.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={onBrowsePrograms}
                  className="rounded-2xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600"
                >
                  Δες τα Προγράμματα
                </button>
                <button
                  onClick={onUpgrade}
                  className="rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
                >
                  Ξεκίνα Upgrade / Trial
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              <MicroSignal
                theme={theme}
                label="Current tier"
                value="Basic"
                helper="Σωστό default για ασφάλεια. Όχι τυχαίο premium access επειδή έλειψε metadata."
              />
              <MicroSignal
                theme={theme}
                label="Best next step"
                value="Trial → Paid"
                helper="Βγάλε τον κόσμο από το τσάμπα preview και βάλ’ τον σε πραγματικό conversion path."
              />
              <MicroSignal
                theme={theme}
                label="Reality check"
                value="Access rules"
                helper="Αν το access model είναι θολό, το billing θα γίνει μπουρδέλο. Κλείδωσέ το νωρίς."
              />
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function MobileDashboard({ user, userLevel }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isBasic = userLevel === "basic";
  const isAdmin = userLevel === "admin";

  const tabs = [
    { key: "home", icon: "🏠", label: "Home" },
    { key: "modules", icon: "🧩", label: "Modules" },
    { key: "insights", icon: isBasic ? "🔒" : "🧠", label: "Insights" },
    { key: "account", icon: "⚙️", label: "Account" },
  ];

  const quickRoutes = [
    { label: "Nutrition", path: "/nutrition", icon: "🍎" },
    { label: "Cardio", path: "/cardio", icon: "🏃" },
    { label: "Training", path: "/training", icon: "🏋️" },
    { label: "Export", path: "/export", icon: "📄" },
  ];

  const tabIndex = tabs.findIndex((t) => t.key === activeTab);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (tabIndex < tabs.length - 1) setActiveTab(tabs[tabIndex + 1].key);
    },
    onSwipedRight: () => {
      if (tabIndex > 0) setActiveTab(tabs[tabIndex - 1].key);
    },
    trackTouch: true,
    trackMouse: false,
  });

  const tabVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <motion.div key="home" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            <div className="space-y-4 text-left">
              <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-400">
                  FIT MENU
                </div>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Hello, {user?.firstName || "Athlete"}
                </h2>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  Mobile dashboard mode για γρήγορη πρόσβαση. Όχι πλήρες war room, αλλά αρκετά χρήσιμο για να μη ψάχνεσαι σαν χαμένος.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-inset ring-white/8">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Tier</div>
                  <div className="mt-2 text-lg font-black text-yellow-400">
                    {isAdmin ? "Admin" : isBasic ? "Basic" : userLevel.toUpperCase()}
                  </div>
                </div>
                <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-inset ring-white/8">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">Status</div>
                  <div className="mt-2 text-lg font-black text-yellow-400">Ready</div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "modules":
        return (
          <motion.div key="modules" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            <div className="grid gap-3 text-left">
              {quickRoutes
                .filter((item) => !(item.label === "Export" && isBasic))
                .map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="flex items-center justify-between rounded-2xl bg-zinc-900/80 px-4 py-4 ring-1 ring-inset ring-white/8 transition hover:ring-yellow-400/18"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    <span className="text-yellow-400">→</span>
                  </button>
                ))}
            </div>
          </motion.div>
        );

      case "insights":
        return isBasic ? (
          <motion.div key="insights-locked" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 text-left">
              <h2 className="text-lg font-black text-yellow-400">Insights Locked</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-300">
                Τα advanced insights δεν είναι για basic πρόσβαση. Δεν θα σου πουλήσω premium UI και να είναι άδειο από κάτω.
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="mt-4 rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-bold text-black hover:bg-yellow-400"
              >
                Upgrade
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="insights" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            <div className="rounded-3xl bg-zinc-900/80 p-5 text-left ring-1 ring-inset ring-white/8">
              <h2 className="text-lg font-black text-yellow-400">Insights</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-300">
                Εδώ χωράνε premium summaries, readiness, recovery και καλύτερα conversion nudges. Όχι ακόμα fake AI για εντυπωσιασμό.
              </p>
            </div>
          </motion.div>
        );

      case "account":
        return (
          <motion.div key="account" variants={tabVariants} initial="initial" animate="animate" exit="exit">
            <div className="grid gap-3 text-left">
              <button
                onClick={() => navigate("/pricing")}
                className="rounded-2xl bg-zinc-900/80 px-4 py-4 text-sm font-bold ring-1 ring-inset ring-white/8 hover:ring-yellow-400/18"
              >
                💳 Pricing / Upgrade
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-2xl bg-zinc-900/80 px-4 py-4 text-sm font-bold ring-1 ring-inset ring-white/8 hover:ring-yellow-400/18"
              >
                🖥️ Open Desktop Dashboard
              </button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white">
      <div className="p-5 pt-8" {...swipeHandlers}>
        <div className="mb-5 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-400">
            PWA Mode
          </div>
          <h1 className="mt-2 text-2xl font-black">Health&apos;s Spot Mobile</h1>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            Swipe αριστερά/δεξιά ή πάτα tab. Το κινητό θέλει απλότητα, όχι dashboard λαβύρινθο.
          </p>
        </div>

        <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
      </div>

      {showUpgradeModal ? (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={() => navigate("/pricing")}
        />
      ) : null}

      <nav className="sticky bottom-0 left-0 z-40 mx-auto mb-3 flex w-[92%] max-w-md justify-between rounded-full bg-zinc-950/90 px-4 py-2 shadow-xl backdrop-blur-xl ring-1 ring-white/8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === "insights" && isBasic) {
                setShowUpgradeModal(true);
                return;
              }
              setActiveTab(tab.key);
            }}
            className={`flex flex-col items-center px-3 py-1 text-xs transition duration-300 ${
              activeTab === tab.key ? "scale-110 text-yellow-400" : "text-white"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="mt-0.5 text-[10px]">{tab.label}</span>
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
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("hideDashboardTip") !== "true";
  });

  const userLevel = useMemo(() => getUserTier(user), [user]);
  const isAdmin = userLevel === "admin";
  const isBasic = userLevel === "basic";

  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

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

  const quickActions = useMemo(
    () => [
      { label: "Nutrition", sublabel: "Macros, targets και meal planning", icon: "🍎", path: "/nutrition" },
      { label: "Cardio", sublabel: "VO₂, trends και endurance view", icon: "🏃", path: "/cardio" },
      { label: "Training", sublabel: "Strength markers και loading logic", icon: "🏋️", path: "/training" },
      { label: "Export", sublabel: "Report generation και deliverables", icon: "📄", path: "/export" },
    ],
    []
  );

  const microSignals = useMemo(
    () => [
      {
        label: "Command",
        value: "FIT MENU",
        helper: "One home for performance, recovery and nutrition oversight.",
      },
      {
        label: "Workflow",
        value: "Fast access",
        helper: "Jump straight into the modules that actually move the numbers.",
      },
      {
        label: "Discipline",
        value: "Weekly logging",
        helper: "Good dashboard, bad data = expensive decoration. Feed it consistently.",
      },
    ],
    []
  );

  const particleOptions = useMemo(
    () => ({
      fullScreen: false,
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      interactivity: {
        detectsOn: "canvas",
        events: { onHover: { enable: true, mode: "repulse" }, resize: true },
        modes: { repulse: { distance: 36, duration: 0.25 } },
      },
      particles: {
        number: { value: 28, density: { enable: true, area: 1200 } },
        color: { value: theme === "dark" ? ["#facc15", "#60a5fa", "#ffffff"] : ["#eab308", "#2563eb", "#0f172a"] },
        shape: { type: "circle" },
        opacity: { value: 0.12, random: true },
        size: { value: { min: 1, max: 2.2 } },
        move: { enable: true, speed: 0.14, direction: "none", random: true, outModes: "out" },
      },
      detectRetina: true,
    }),
    [theme]
  );

  const handleGotIt = () => setShowTip(false);

  const handleHideForever = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("hideDashboardTip", "true");
    }
    setShowTip(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/dashboard") {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, []);

  if (isPWA && user) {
    return <MobileDashboard user={user} userLevel={userLevel} />;
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          theme === "dark" ? "bg-black text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Health&apos;s Spot | FIT MENU</title>
          <meta
            name="description"
            content="FIT MENU dashboard for health metrics, performance and nutrition overview."
          />
        </Helmet>

        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
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
      </>
    );
  }

  if (isBasic) {
    return (
      <>
        <Helmet>
          <title>Health&apos;s Spot | Basic Dashboard</title>
          <meta
            name="description"
            content="Health's Spot basic dashboard and upgrade gateway."
          />
        </Helmet>

        <DashboardAccessGate
          theme={theme}
          user={user}
          onUpgrade={() => navigate("/pricing")}
          onBrowsePrograms={() => navigate("/programs")}
        />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Health&apos;s Spot | FIT MENU</title>
        <meta
          name="description"
          content="FIT MENU dashboard for health metrics, performance and nutrition overview."
        />
      </Helmet>

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
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Particles id="dashboard-particles" init={particlesInit} options={particleOptions} />
        </div>

        <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_0.95fr]">
            <Surface theme={theme} accent className="relative overflow-hidden p-6 md:p-8">
              <div
                className={`absolute inset-0 opacity-70 ${
                  theme === "dark"
                    ? "bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_34%)]"
                    : "bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.10),transparent_30%)]"
                }`}
              />
              <div className="relative flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill theme={theme}>FIT MENU</Pill>
                  <Pill theme={theme}>{isAdmin ? "Admin View" : "Premium View"}</Pill>
                  <Pill theme={theme}>Private Metrics</Pill>
                </div>

                <div className="max-w-3xl">
                  <h1 className="text-3xl font-black tracking-tight text-yellow-400 md:text-5xl">
                    It&apos;s ON, {user?.firstName || "Athlete"}
                  </h1>
                  <p
                    className={`mt-3 max-w-2xl text-sm leading-7 md:text-base ${
                      theme === "dark" ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    Το FIT MENU είναι το κεντρικό command room σου για performance markers,
                    nutrition setup, recovery signal και γρήγορη μετάβαση στα modules χωρίς
                    dashboard-σαλάτα και διακοσμητικές ανοησίες.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/export")}
                    className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400"
                  >
                    📜 Open Export
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
                    <div
                      className={`mt-1 text-xs ${
                        theme === "dark" ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Dashboard shell active
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-3 text-right ${
                      theme === "dark"
                        ? "bg-slate-900/72 ring-1 ring-inset ring-white/6"
                        : "bg-slate-50/90 ring-1 ring-inset ring-slate-200/70"
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Tier
                    </div>
                    <div className="mt-1 text-lg font-bold">
                      {isAdmin ? "Admin" : userLevel.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div
                  className={`h-2 w-full overflow-hidden rounded-full ${
                    theme === "dark" ? "bg-slate-800" : "bg-slate-200"
                  }`}
                >
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MicroSignal
                    theme={theme}
                    label="Status"
                    value="Ready"
                    helper="Modules armed, shortcuts clean, dashboard stable."
                  />
                  <MicroSignal
                    theme={theme}
                    label="Focus"
                    value="Metrics first"
                    helper="Weekly entries decide whether this view helps or lies."
                  />
                </div>

                {showTip ? (
                  <div
                    className={`rounded-2xl p-4 ${
                      theme === "dark"
                        ? "bg-slate-900/68 ring-1 ring-inset ring-yellow-400/14"
                        : "bg-yellow-50/90 ring-1 ring-inset ring-yellow-500/18"
                    }`}
                  >
                    <div className="text-sm font-bold text-yellow-400">💡 FIT MENU Tip</div>
                    <p
                      className={`mt-2 text-xs leading-6 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      Πρόσθεσε BMR, VO₂max, macros και stress metrics σταθερά. Το dashboard
                      είναι χρήσιμο μόνο όταν το τροφοδοτείς. Άδειο dashboard = ωραίο ψέμα.
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
                  <div
                    className={`rounded-2xl p-4 text-sm ${
                      theme === "dark"
                        ? "bg-slate-900/68 text-slate-300 ring-1 ring-inset ring-white/6"
                        : "bg-slate-50/85 text-slate-600 ring-1 ring-inset ring-slate-200/70"
                    }`}
                  >
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
                <h2 className="mt-1 text-2xl font-black text-yellow-400 md:text-3xl">
                  FIT MENU Metrics Lab
                </h2>
                <p
                  className={`mt-2 max-w-3xl text-sm leading-7 ${
                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Εδώ ζει το πραγματικό dashboard: trends, macro profile, stress curve και weekly
                  metric capture. Πρώτα καθαρά δεδομένα, μετά συμπεράσματα. Όχι το ανάποδο σαν
                  τηλεοπτικό πάνελ.
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

            <div
              className={`mt-5 rounded-[24px] p-3 md:p-4 ${
                theme === "dark"
                  ? "bg-black/22 ring-1 ring-inset ring-white/6"
                  : "bg-white/72 ring-1 ring-inset ring-slate-200/70"
              }`}
            >
              <AdvancedMetrics />
            </div>
          </Surface>
        </div>
      </motion.div>
    </>
  );
}
