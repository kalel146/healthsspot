import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser } from "@clerk/clerk-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "./ThemeContext";
import { supabase } from "./supabaseClient";

const DRAFT_STORAGE_KEY = "recoveryModuleDraft";
const LOW_RECOVERY_THRESHOLD = 3.2;
const LOW_RECOVERY_STREAK_TRIGGER = 4;

const defaultInputs = {
  sleep: 3,
  energy: 3,
  pain: 3,
  mood: 3,
  stress: 3,
};

const labels = {
  sleep: "Ύπνος",
  energy: "Ενέργεια",
  pain: "Μυϊκός Πόνος",
  mood: "Διάθεση",
  stress: "Στρες",
};

const helperText = {
  sleep: "1 = πολύ κακός, 5 = άριστος",
  energy: "1 = εξάντληση, 5 = πολύ υψηλή",
  pain: "1 = καθόλου, 5 = πολύ έντονος",
  mood: "1 = πολύ κακή, 5 = πολύ καλή",
  stress: "1 = πολύ χαμηλό, 5 = πολύ υψηλό",
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampSliderValue = (value, fallback = 3) => {
  const parsed = safeNumber(value, fallback);
  return Math.min(5, Math.max(1, parsed));
};

const safeReadLocalJson = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read localStorage key: ${key}`, error);
    return fallback;
  }
};

const safeWriteLocalJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write localStorage key: ${key}`, error);
  }
};

const safeRemoveLocalKey = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key: ${key}`, error);
  }
};

const isUserIdColumnUnsupported = (error) => {
  const blob = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  return blob.includes("user_id") &&
    (blob.includes("column") ||
      blob.includes("schema cache") ||
      blob.includes("does not exist") ||
      blob.includes("not found"));
};

const calculateCoreRecoveryScore = (values) => {
  const score =
    (safeNumber(values.sleep) +
      safeNumber(values.energy) +
      safeNumber(values.mood) +
      (6 - safeNumber(values.pain))) /
    4;

  return Number(score.toFixed(1));
};

const calculateReadinessScore = (values) => {
  const core = calculateCoreRecoveryScore(values);
  const adjustedStress = 6 - safeNumber(values.stress);
  const readiness = (core * 4 + adjustedStress) / 5;
  return Number(readiness.toFixed(1));
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRecoveryTone = (score) => {
  if (score >= 4.2) {
    return {
      label: "Πολύ καλή αποκατάσταση",
      badge: "High readiness",
      message: "Μπορείς να σηκώσεις ένταση χωρίς να παίζεις ρώσικη ρουλέτα με το fatigue.",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (score >= 3.2) {
    return {
      label: "Μέτρια αποκατάσταση",
      badge: "Watch volume",
      message: "Το σύστημα στέκεται, αλλά δεν ουρλιάζει και για PR day.",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    };
  }

  return {
    label: "Χαμηλή αποκατάσταση",
    badge: "Deload / easier day",
    message: "Εδώ δεν θες ηρωισμούς. Θες εξυπνάδα, έλεγχο και λιγότερη ανοησία.",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  };
};

const getReadinessPlan = (readiness, stress) => {
  if (readiness >= 4.3 && stress <= 3) {
    return {
      title: "Push Day",
      description: "Καλή μέρα για ένταση, ποιοτικά main lifts και επιθετικότερη φόρτιση.",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (readiness >= 3.3) {
    return {
      title: "Moderate Day",
      description: "Κράτα ποιότητα, αλλά όχι υπερβολές. Τεχνική, όγκος υπό έλεγχο, λογικά RPE.",
      className: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    };
  }

  return {
    title: "Deload / Recovery Bias",
    description: "Προτεραιότητα στην αποκατάσταση, χαμηλότερο volume ή active recovery.",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  };
};

const getScopeMeta = (scopeMode) => {
  if (scopeMode === "scoped") {
    return {
      label: "Scoped",
      helper: "Τα entries φορτώνονται με user scope.",
    };
  }

  if (scopeMode === "legacy") {
    return {
      label: "Legacy",
      helper: "Fallback mode χωρίς user_id isolation.",
    };
  }

  return {
    label: "Local",
    helper: "Draft only μέχρι να γίνει login.",
  };
};

const getLowRecoveryStreak = (entries) => {
  let streak = 0;

  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i];
    const isLow =
      safeNumber(entry?.recoveryScore, 0) < LOW_RECOVERY_THRESHOLD ||
      safeNumber(entry?.readinessScore, 0) < LOW_RECOVERY_THRESHOLD;

    if (!isLow) break;
    streak += 1;
  }

  return streak;
};

export default function RecoveryModule() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  const [inputs, setInputs] = useState(defaultInputs);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [scopeMode, setScopeMode] = useState("local");

  const skipNextDraftSaveRef = useRef(false);
  const isDark = theme === "dark";

  const pageClass = isDark ? "bg-black text-white" : "bg-zinc-50 text-black";

  const panelClass = isDark
    ? "rounded-2xl border border-white/10 bg-zinc-900/80 shadow-xl shadow-black/20 backdrop-blur"
    : "rounded-2xl border border-black/5 bg-white shadow-lg shadow-black/5";

  const mutedTextClass = isDark ? "text-zinc-400" : "text-zinc-500";
  const titleClass = isDark ? "text-white" : "text-zinc-900";
  const softCardClass = isDark
    ? "rounded-xl border border-white/10 bg-white/5 p-4"
    : "rounded-xl border border-zinc-200 bg-zinc-50 p-4";
  const chipClass = isDark
    ? "rounded-full bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    : "rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700";
  const localNoticeClass = isDark
    ? "rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300"
    : "rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800";
  const legacyNoticeClass = isDark
    ? "rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
    : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800";
  const successClass = isDark
    ? "rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
    : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800";
  const errorClass = isDark
    ? "rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
    : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800";
  const infoClass = isDark
    ? "rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-300"
    : "rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800";
  const inputTrackClass = "w-full accent-cyan-500";

  const statCardClass = `${panelClass} p-5`;
  const sectionClass = `${panelClass} p-5 md:p-6`;

  useEffect(() => {
    const saved = safeReadLocalJson(DRAFT_STORAGE_KEY, null);
    if (!saved) return;

    setInputs({
      sleep: clampSliderValue(saved.sleep, 3),
      energy: clampSliderValue(saved.energy, 3),
      pain: clampSliderValue(saved.pain, 3),
      mood: clampSliderValue(saved.mood, 3),
      stress: clampSliderValue(saved.stress, 3),
    });
  }, []);

  useEffect(() => {
    if (skipNextDraftSaveRef.current) {
      skipNextDraftSaveRef.current = false;
      return;
    }

    safeWriteLocalJson(DRAFT_STORAGE_KEY, inputs);
  }, [inputs]);

  const fetchRecoveryHistory = useCallback(
    async ({ silent = false } = {}) => {
      if (!user?.id) {
        setScopeMode("local");
        setHistory([]);
        setIsLoadingHistory(false);
        setIsRefreshing(false);
        return;
      }

      if (!silent) setIsLoadingHistory(true);
      setIsRefreshing(silent);
      setErrorMessage("");

      let query = supabase
        .from("strength_logs")
        .select("*")
        .eq("type", "Recovery")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: true });

      let { data, error } = await query;

      if (error && isUserIdColumnUnsupported(error)) {
        console.warn("Recovery history fetch falling back to legacy mode without user_id:", error);
        setScopeMode("legacy");

        const fallback = await supabase
          .from("strength_logs")
          .select("*")
          .eq("type", "Recovery")
          .order("timestamp", { ascending: true });

        data = fallback.data;
        error = fallback.error;
      } else {
        setScopeMode("scoped");
      }

      if (error) {
        console.error("Recovery history fetch failed:", error);
        setErrorMessage("Αποτυχία ανάκτησης recovery history.");
        setHistory([]);
        setIsLoadingHistory(false);
        setIsRefreshing(false);
        return;
      }

      const normalizedData = Array.isArray(data) ? data : [];
      normalizedData.sort((a, b) => {
        const left = new Date(a?.timestamp ?? a?.date ?? 0).getTime();
        const right = new Date(b?.timestamp ?? b?.date ?? 0).getTime();
        return left - right;
      });

      setHistory(normalizedData);
      setIsLoadingHistory(false);
      setIsRefreshing(false);
    },
    [user?.id]
  );

  useEffect(() => {
    fetchRecoveryHistory();
  }, [fetchRecoveryHistory]);

  const normalizedHistory = useMemo(() => {
    return (Array.isArray(history) ? history : [])
      .map((entry, index) => {
        const recoveryScore = safeNumber(entry?.recoveryScore, 0);
        const stress = safeNumber(entry?.stress, 0);

        const derivedReadiness =
          safeNumber(entry?.readinessScore, 0) > 0
            ? safeNumber(entry.readinessScore, 0)
            : stress > 0
            ? Number((((recoveryScore * 4) + (6 - stress)) / 5).toFixed(1))
            : recoveryScore;

        return {
          id: entry?.id ?? `${entry?.timestamp ?? entry?.date ?? "recovery"}-${index}`,
          timestamp: entry?.timestamp ?? entry?.date ?? null,
          dateLabel: formatDate(entry?.timestamp ?? entry?.date),
          dateTimeLabel: formatDateTime(entry?.timestamp ?? entry?.date),
          recoveryScore,
          readinessScore: derivedReadiness,
          sleep: safeNumber(entry?.sleep, 0),
          energy: safeNumber(entry?.energy, 0),
          pain: safeNumber(entry?.pain, 0),
          mood: safeNumber(entry?.mood, 0),
          stress,
        };
      })
      .filter((entry) => entry.recoveryScore > 0);
  }, [history]);

  const previewScore = useMemo(() => calculateCoreRecoveryScore(inputs), [inputs]);
  const previewReadiness = useMemo(() => calculateReadinessScore(inputs), [inputs]);
  const previewTone = useMemo(() => getRecoveryTone(previewScore), [previewScore]);

  const readinessPlan = useMemo(
    () => getReadinessPlan(previewReadiness, safeNumber(inputs.stress, 3)),
    [previewReadiness, inputs.stress]
  );

  const weakLinks = useMemo(() => {
    const flags = [];

    if (safeNumber(inputs.sleep) <= 2) flags.push("ύπνος");
    if (safeNumber(inputs.energy) <= 2) flags.push("ενέργεια");
    if (safeNumber(inputs.mood) <= 2) flags.push("διάθεση");
    if (safeNumber(inputs.pain) >= 4) flags.push("μυϊκός πόνος");
    if (safeNumber(inputs.stress) >= 4) flags.push("στρες");

    return flags;
  }, [inputs]);

  const latestEntry = normalizedHistory.length > 0 ? normalizedHistory[normalizedHistory.length - 1] : null;
  const recentEntries = useMemo(() => normalizedHistory.slice(-8).reverse(), [normalizedHistory]);
  const last7Entries = useMemo(() => normalizedHistory.slice(-7), [normalizedHistory]);

  const averageLast7Recovery = useMemo(() => {
    if (last7Entries.length === 0) return null;
    const avg = last7Entries.reduce((sum, entry) => sum + entry.recoveryScore, 0) / last7Entries.length;
    return Number(avg.toFixed(1));
  }, [last7Entries]);

  const averageLast7Readiness = useMemo(() => {
    if (last7Entries.length === 0) return null;
    const avg = last7Entries.reduce((sum, entry) => sum + entry.readinessScore, 0) / last7Entries.length;
    return Number(avg.toFixed(1));
  }, [last7Entries]);

  const trendDelta = useMemo(() => {
    const latestThree = normalizedHistory.slice(-3);
    const previousThree = normalizedHistory.slice(-6, -3);

    if (latestThree.length < 3 || previousThree.length < 3) return null;

    const latestAvg = latestThree.reduce((sum, entry) => sum + entry.recoveryScore, 0) / 3;
    const previousAvg = previousThree.reduce((sum, entry) => sum + entry.recoveryScore, 0) / 3;

    return Number((latestAvg - previousAvg).toFixed(1));
  }, [normalizedHistory]);

  const chartData = useMemo(
    () =>
      normalizedHistory.slice(-14).map((entry) => ({
        date: entry.dateLabel,
        recoveryScore: entry.recoveryScore,
        readinessScore: entry.readinessScore,
      })),
    [normalizedHistory]
  );

  const lowRecoveryStreak = useMemo(() => getLowRecoveryStreak(normalizedHistory), [normalizedHistory]);
  const shouldSuggestDeload = lowRecoveryStreak >= LOW_RECOVERY_STREAK_TRIGGER;
  const scopeMeta = useMemo(() => getScopeMeta(scopeMode), [scopeMode]);

  const handleChange = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: clampSliderValue(value, prev[key]),
    }));
  };

  const handleReset = () => {
    skipNextDraftSaveRef.current = true;
    safeRemoveLocalKey(DRAFT_STORAGE_KEY);
    setInputs(defaultInputs);
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleRefresh = async () => {
    await fetchRecoveryHistory({ silent: true });
  };

  const handleSaveRecovery = async () => {
    if (!user?.id) {
      setErrorMessage("Συνδέσου για να αποθηκεύεται το recovery check-in στο cloud history.");
      setStatusMessage("");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    const basePayload = {
      type: "Recovery",
      ...inputs,
      recoveryScore: previewScore,
      readinessScore: previewReadiness,
      timestamp: new Date().toISOString(),
    };

    let payload = { ...basePayload, user_id: user.id };
    let { error } = await supabase.from("strength_logs").insert([payload]);

    if (error && isUserIdColumnUnsupported(error)) {
      console.warn("Recovery save falling back to legacy mode without user_id:", error);
      setScopeMode("legacy");
      payload = { ...basePayload };
      const fallback = await supabase.from("strength_logs").insert([payload]);
      error = fallback.error;
    } else {
      setScopeMode("scoped");
    }

    if (error) {
      console.error("Recovery save failed:", error);
      setErrorMessage("Αποτυχία αποθήκευσης recovery check-in.");
      setIsSaving(false);
      return;
    }

    setStatusMessage(`✅ Recovery check-in αποθηκεύτηκε (${previewScore}/5).`);
    setIsSaving(false);
    await fetchRecoveryHistory({ silent: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
      className={`min-h-screen px-4 py-8 md:px-6 xl:px-8 ${pageClass}`}
    >
      <Helmet>
        <title>Recovery Station | Health's Spot</title>
        <meta
          name="description"
          content="Recovery Station με live readiness scoring, ιστορικό recovery και τάσεις αποκατάστασης στο Health's Spot."
        />
        <link rel="canonical" href="https://healthsspot.vercel.app/recovery" />
      </Helmet>

      <div className="mx-auto w-full max-w-7xl space-y-6">
        {!user?.id && (
          <div className={localNoticeClass}>
            Δεν έχεις συνδεθεί — το draft των sliders μένει τοπικά, αλλά cloud history και save check-ins θέλουν login.
          </div>
        )}

        {user?.id && scopeMode === "legacy" && (
          <div className={legacyNoticeClass}>
            Το <code>strength_logs</code> φαίνεται να δουλεύει χωρίς <code>user_id</code>. Το module συνεχίζει σε legacy mode για να μη νεκρώσει, αλλά αν θες σωστό per-user isolation, θέλει column <code>user_id</code> στο table.
          </div>
        )}

        {shouldSuggestDeload && (
          <div className={errorClass}>
            Recovery warning: υπάρχουν {lowRecoveryStreak} συνεχόμενα χαμηλά check-ins. Εδώ δεν θες εγωισμό — θες deload bias ή τουλάχιστον πιο μαζεμένο training day.
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 md:text-4xl">Recovery Station</h1>
            <p className={`mt-1 text-sm md:text-base ${mutedTextClass}`}>
              Readiness, self-report, trend εικόνα και πραγματικό history — όχι ένα γυμνό form που απλώς σου πετάει έναν αριθμό.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-600"
            >
              {theme === "dark" ? "☀ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !user?.id}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "↻ Refresh"}
            </button>

            <button
              onClick={handleReset}
              className="rounded-xl bg-zinc-600 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              ♻ Reset
            </button>

            <button
              onClick={handleSaveRecovery}
              disabled={isSaving || !user?.id}
              title={user?.id ? "Αποθήκευση check-in στο recovery history" : "Συνδέσου για cloud save"}
              className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : !user?.id ? "🔒 Sign in to Save" : "💾 Save Check-in"}
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Live Recovery Score</p>
            <p className="mt-2 text-2xl font-bold text-cyan-400">{previewScore}/5</p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Live Readiness</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{previewReadiness}/5</p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Τελευταίο Check-in</p>
            <p className="mt-2 text-2xl font-bold text-yellow-400">
              {latestEntry ? `${latestEntry.recoveryScore}/5` : "--"}
            </p>
            <p className={`mt-1 text-xs ${mutedTextClass}`}>
              {latestEntry ? latestEntry.dateTimeLabel : "Δεν υπάρχει entry ακόμα"}
            </p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>7-day Average</p>
            <p className="mt-2 text-2xl font-bold text-pink-400">
              {averageLast7Recovery !== null ? `${averageLast7Recovery}/5` : "--"}
            </p>
            <p className={`mt-1 text-xs ${mutedTextClass}`}>{normalizedHistory.length} συνολικά entries</p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Mode</p>
            <p className="mt-2 text-2xl font-bold text-violet-400">{scopeMeta.label}</p>
            <p className={`mt-1 text-xs ${mutedTextClass}`}>{scopeMeta.helper}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="space-y-6 xl:col-span-7">
            <div className={sectionClass}>
              <div className="mb-5">
                <h2 className={`text-xl font-semibold ${titleClass}`}>Self-Report Check-in</h2>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Core recovery score συμβατό με το Strength module, με stress να επηρεάζει το readiness και όχι να χαλάει το shared scoring model.
                </p>
              </div>

              <div className="space-y-5">
                {Object.entries(inputs).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="font-medium">{labels[key]}</label>
                      <span className={`text-sm font-semibold ${mutedTextClass}`}>{value}/5</span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={value}
                      onChange={(event) => handleChange(key, event.target.value)}
                      className={inputTrackClass}
                    />

                    <p className={`text-xs ${mutedTextClass}`}>{helperText[key]}</p>
                  </div>
                ))}
              </div>

              {(statusMessage || errorMessage) && (
                <div className="mt-5 space-y-2">
                  {statusMessage && <div className={successClass}>{statusMessage}</div>}
                  {errorMessage && <div className={errorClass}>{errorMessage}</div>}
                </div>
              )}
            </div>

            <div className={sectionClass}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-400">Recovery Trend</h2>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    Τα τελευταία 14 check-ins για να βλέπεις αν όντως αναρρώνεις ή απλώς λες στον εαυτό σου ωραία παραμύθια.
                  </p>
                </div>
                <span className={chipClass}>Last 14 entries</span>
              </div>

              {isLoadingHistory ? (
                <p className={mutedTextClass}>Φόρτωση history...</p>
              ) : chartData.length === 0 ? (
                <p className={mutedTextClass}>Δεν υπάρχουν δεδομένα ακόμα.</p>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#27272a" : "#e4e4e7"} />
                      <XAxis dataKey="date" stroke={isDark ? "#a1a1aa" : "#71717a"} />
                      <YAxis domain={[1, 5]} allowDecimals={false} stroke={isDark ? "#a1a1aa" : "#71717a"} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? "#09090b" : "#ffffff",
                          border: `1px solid ${isDark ? "#27272a" : "#e4e4e7"}`,
                          borderRadius: "12px",
                          color: isDark ? "#ffffff" : "#111111",
                        }}
                      />
                      <ReferenceLine y={3} stroke="#f59e0b" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="recoveryScore" name="Recovery" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="readinessScore" name="Readiness" stroke="#34d399" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6 xl:col-span-5">
            <div className={sectionClass}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-emerald-400">Current Interpretation</h2>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Όχι απλώς score. Θέλεις και νόημα, αλλιώς είναι αριθμητική για παρηγοριά.
                </p>
              </div>

              <div className={`rounded-2xl border p-4 ${previewTone.className}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-lg font-bold">{previewTone.label}</p>
                  <span className={chipClass}>{previewTone.badge}</span>
                </div>
                <p className="mt-3 text-sm leading-6">{previewTone.message}</p>
              </div>

              <div className={`mt-4 rounded-2xl border p-4 ${readinessPlan.className}`}>
                <p className="text-lg font-bold">{readinessPlan.title}</p>
                <p className="mt-2 text-sm leading-6">{readinessPlan.description}</p>
              </div>

              {weakLinks.length > 0 && (
                <div className={`${infoClass} mt-4`}>
                  Bottlenecks τώρα: <strong>{weakLinks.join(", ")}</strong>. Δεν χρειάζεται μαντική — χρειάζεται να φτιάξεις αυτά πρώτα.
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className={softCardClass}>
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>7-day Avg Recovery</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-400">
                    {averageLast7Recovery !== null ? `${averageLast7Recovery}/5` : "--"}
                  </p>
                </div>

                <div className={softCardClass}>
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>7-day Avg Readiness</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">
                    {averageLast7Readiness !== null ? `${averageLast7Readiness}/5` : "--"}
                  </p>
                </div>

                <div className={softCardClass}>
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Trend Δ</p>
                  <p
                    className={`mt-2 text-2xl font-bold ${
                      trendDelta === null
                        ? "text-zinc-400"
                        : trendDelta > 0
                        ? "text-emerald-400"
                        : trendDelta < 0
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  >
                    {trendDelta === null ? "--" : `${trendDelta > 0 ? "+" : ""}${trendDelta}`}
                  </p>
                </div>

                <div className={softCardClass}>
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Low Streak</p>
                  <p className="mt-2 text-2xl font-bold text-yellow-400">{lowRecoveryStreak}</p>
                  <p className={`mt-1 text-xs ${mutedTextClass}`}>
                    {shouldSuggestDeload ? "Deload bias suggested" : "No critical streak right now"}
                  </p>
                </div>
              </div>
            </div>

            <div className={sectionClass}>
              <h2 className="mb-4 text-xl font-semibold text-pink-400">Recent Check-ins</h2>

              {isLoadingHistory ? (
                <p className={mutedTextClass}>Φόρτωση entries...</p>
              ) : recentEntries.length === 0 ? (
                <p className={mutedTextClass}>Δεν υπάρχουν check-ins ακόμα.</p>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map((entry) => {
                    const tone = getRecoveryTone(entry.recoveryScore);

                    return (
                      <div key={entry.id} className={`rounded-xl border p-4 ${tone.className}`}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold">{entry.dateTimeLabel}</p>
                            <p className="text-xs opacity-80">
                              Sleep {entry.sleep || "-"} • Energy {entry.energy || "-"} • Mood {entry.mood || "-"} • Pain {entry.pain || "-"} • Stress {entry.stress || "-"}
                            </p>
                          </div>

                          <div className="text-sm font-bold">
                            {entry.recoveryScore}/5 Recovery • {entry.readinessScore}/5 Readiness
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
