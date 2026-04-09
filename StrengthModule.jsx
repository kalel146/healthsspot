
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser } from "@clerk/clerk-react";
import { useTheme } from "./ThemeContext";
import { Info, RefreshCcw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { supabase } from "./supabaseClient";
import StrengthForm from "./StrengthForm";
import StrengthChart from "./StrengthChart";
import RecoveryTracker from "./RecoveryTracker";
import ExportButtons from "./ExportButtons";

const pageVariants = {
  initial: { opacity: 0, y: 36, scale: 0.98 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -28, scale: 0.98 },
};

const pageTransition = {
  type: "spring",
  stiffness: 90,
  damping: 20,
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const defaultStressData = {
  sleep: 3,
  energy: 3,
  pain: 3,
  mood: 3,
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const escapeCsvCell = (value) => {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const downloadCsv = (filename, rows) => {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const formatDateLabel = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("el-GR");
};

const formatDateTime = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("el-GR");
};

const isUserIdColumnUnsupported = (error) => {
  const blob = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  return (
    blob.includes("user_id") &&
    (blob.includes("column") ||
      blob.includes("schema cache") ||
      blob.includes("does not exist") ||
      blob.includes("not found"))
  );
};

const getRecoveryTone = (score) => {
  if (score >= 4.2) {
    return {
      label: "High readiness",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      message: "Μπορείς να πιέσεις. Όχι τρέλα, αλλά όχι και βαφτίσια.",
    };
  }

  if (score >= 3) {
    return {
      label: "Moderate readiness",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
      message: "Κράτα ποιότητα, αλλά όχι χαζο-ηρωισμούς.",
    };
  }

  return {
    label: "Low readiness",
    className: "border-rose-500/20 bg-rose-500/10 text-rose-300",
    message: "Κόψε ένταση ή deload. Το σώμα δεν διαπραγματεύεται με το εγώ σου.",
  };
};

export default function StrengthModule() {
  const { theme, toggleTheme } = useTheme();
  const { user, isLoaded } = useUser();

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("1");
  const [maxOneRM, setMaxOneRM] = useState(null);
  const [error, setError] = useState("");
  const [rpe, setRpe] = useState("7");
  const [rir, setRir] = useState("3");
  const [rpeError, setRpeError] = useState("");
  const [stressData, setStressData] = useState(defaultStressData);
  const [recoveryScore, setRecoveryScore] = useState(null);

  const [logData, setLogData] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [recoveryLogs, setRecoveryLogs] = useState([]);

  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isSavingOneRM, setIsSavingOneRM] = useState(false);
  const [isSavingRecovery, setIsSavingRecovery] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [scopeMode, setScopeMode] = useState("local");

  const [aiSuggestions, setAiSuggestions] = useState("");
  const [autoAdaptiveMessage, setAutoAdaptiveMessage] = useState("");
  const [prMessage, setPrMessage] = useState("");
  const [coachAdvice, setCoachAdvice] = useState("");
  const [cyclePlan, setCyclePlan] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [cycleType, setCycleType] = useState("Linear");
  const [cycleOutput, setCycleOutput] = useState("");
  const [userCycleMode, setUserCycleMode] = useState("Auto");

  const [isExportingReportPdf, setIsExportingReportPdf] = useState(false);
  const [isExportingCoachPdf, setIsExportingCoachPdf] = useState(false);
  const [isExportingAllLogsPdf, setIsExportingAllLogsPdf] = useState(false);
  const [isExportingCyclePdf, setIsExportingCyclePdf] = useState(false);

  const latestNotificationTextsRef = useRef([]);

  const isDark = theme === "dark";

  const pushNotification = useCallback((text, tone = "info") => {
    setNotifications((prev) => {
      if (prev.slice(-4).some((entry) => entry.text === text)) return prev;
      if (latestNotificationTextsRef.current.includes(text)) return prev;

      const next = [
        ...prev,
        { id: Date.now() + Math.random(), text, tone },
      ];

      latestNotificationTextsRef.current = [
        ...latestNotificationTextsRef.current.slice(-5),
        text,
      ];

      return next;
    });
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const fetchStrengthData = useCallback(async () => {
    if (!user?.id) {
      setScopeMode("local");
      setAllLogs([]);
      setLogData([]);
      setRecoveryLogs([]);
      setIsLoadingLogs(false);
      return;
    }

    setIsLoadingLogs(true);
    setErrorMessage("");

    let query = supabase
      .from("strength_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: true });

    let { data, error } = await query;

    if (error && isUserIdColumnUnsupported(error)) {
      console.warn("Strength fetch falling back to legacy mode without user_id:", error);
      setScopeMode("legacy");

      const fallback = await supabase
        .from("strength_logs")
        .select("*")
        .order("timestamp", { ascending: true });

      data = fallback.data;
      error = fallback.error;
    } else {
      setScopeMode("scoped");
    }

    if (error) {
      console.error("❌ Error fetching strength data:", error);
      setErrorMessage("Αποτυχία ανάκτησης strength history.");
      setAllLogs([]);
      setLogData([]);
      setRecoveryLogs([]);
      setIsLoadingLogs(false);
      return;
    }

    const logs = Array.isArray(data) ? data : [];
    setAllLogs(logs);

    const strengthEntries = logs.filter((entry) => {
      const type = String(entry?.type || "").toLowerCase();
      return (
        type !== "recovery" &&
        (safeNumber(entry?.maxOneRM, NaN) > 0 || type === "strength" || type === "1rm")
      );
    });

    const recoveryEntries = logs.filter(
      (entry) => String(entry?.type || "").toLowerCase() === "recovery"
    );

    setLogData(strengthEntries);
    setRecoveryLogs(recoveryEntries);

    const best = strengthEntries.reduce(
      (max, entry) => Math.max(max, safeNumber(entry?.maxOneRM, 0)),
      0
    );

    setMaxOneRM(best > 0 ? Number(best.toFixed(1)) : null);

    if (strengthEntries.length > 1) {
      const latest = safeNumber(strengthEntries[strengthEntries.length - 1]?.maxOneRM, 0);
      const previousBest = strengthEntries
        .slice(0, -1)
        .reduce((max, entry) => Math.max(max, safeNumber(entry?.maxOneRM, 0)), 0);

      if (latest > 0 && latest > previousBest) {
        setPrMessage("🎉 Νέο PR καταγράφηκε! Συγχαρητήρια!");
      } else {
        setPrMessage("");
      }
    } else if (strengthEntries.length === 1) {
      setPrMessage("🎯 Πρώτη strength καταγραφή. Τώρα αρχίζει το πραγματικό baseline.");
    } else {
      setPrMessage("");
    }

    setIsLoadingLogs(false);
  }, [user?.id]);

  useEffect(() => {
    fetchStrengthData();
  }, [fetchStrengthData]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("strengthModuleData");
      if (saved) {
        const data = JSON.parse(saved);
        setWeight(String(data.weight ?? ""));
        setReps(String(clamp(safeNumber(data.reps, 1), 1, 10)));
        setRpe(String(clamp(safeNumber(data.rpe, 7), 6, 10)));
        setRir(String(clamp(safeNumber(data.rir, 3), 0, 4)));
        setStressData({
          sleep: clamp(safeNumber(data?.stressData?.sleep, 3), 1, 5),
          energy: clamp(safeNumber(data?.stressData?.energy, 3), 1, 5),
          pain: clamp(safeNumber(data?.stressData?.pain, 3), 1, 5),
          mood: clamp(safeNumber(data?.stressData?.mood, 3), 1, 5),
        });
      }
    } catch (e) {
      console.error("Σφάλμα ανάκτησης δεδομένων από localStorage:", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "strengthModuleData",
      JSON.stringify({ weight, reps, rpe, rir, stressData })
    );
  }, [weight, reps, rpe, rir, stressData]);

  useEffect(() => {
    if (prMessage) pushNotification("🎯 Νέο PR καταγράφηκε επιτυχώς.", "success");
  }, [prMessage, pushNotification]);

  useEffect(() => {
    if (recoveryScore !== null && recoveryScore < 2.5) {
      pushNotification("🛑 Πολύ χαμηλό Recovery — deload ή χαμηλότερη ένταση.", "warn");
    }
  }, [recoveryScore, pushNotification]);

  useEffect(() => {
    if (logData.length >= 3) {
      const lastThree = logData.slice(-3).map((e) => safeNumber(e.maxOneRM, 0));
      const allEqual = lastThree.every((val) => val === lastThree[0]);
      const allDecreasing = lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2];

      if (allEqual && lastThree[0] > 0) {
        pushNotification(
          "⚠ Στασιμότητα 1RM σε 3 σερί sessions — δοκίμασε αλλαγή stimulus ή διαχείριση fatigue.",
          "warn"
        );
      }
      if (allDecreasing) {
        pushNotification(
          "🔻 Πτώση 1RM σε 3 sessions — ξανακοίταξε πρόγραμμα, ύπνο και recovery.",
          "warn"
        );
      }
    }

    if (recoveryLogs.length >= 4) {
      const lowRecovery = recoveryLogs
        .slice(-4)
        .every((e) => safeNumber(e.recoveryScore, 0) < 2.5);

      if (lowRecovery) {
        pushNotification(
          "🧘‍♂️ Recovery Score < 2.5 για 4 ημέρες — deload + active recovery προτείνονται σοβαρά.",
          "warn"
        );
      }
    }
  }, [logData, recoveryLogs, pushNotification]);

  useEffect(() => {
    const rpeValue = clamp(safeNumber(rpe, 7), 6, 10);
    const rirValue = clamp(safeNumber(rir, 3), 0, 4);

    if (rpeValue < 6) {
      setRpeError("⚠ Το RPE πρέπει να είναι ≥ 6.");
      return;
    }

    if (rirValue > 4) {
      setRpeError("⚠ Το RIR πρέπει να είναι ≤ 4.");
      return;
    }

    setRpeError("");
  }, [rpe, rir]);

  useEffect(() => {
    if (!maxOneRM || !rpe || !rir) {
      setAiSuggestions("");
      setAutoAdaptiveMessage("");
      return;
    }

    const effectiveRecovery = recoveryScore ?? latestRecoveryValue ?? null;
    const intensity = safeNumber(maxOneRM, 0) * (1 - clamp(safeNumber(rir, 3), 0, 4) * 0.03);
    let suggestion = `💡 Πρόταση: φόρτωσε περίπου ${intensity.toFixed(
      1
    )} kg για ${10 - clamp(safeNumber(rir, 3), 0, 4)} επαναλήψεις (RPE ${rpe}, RIR ${rir}).`;

    const weeklyIncrement = 0.02;
    const nextWeek = safeNumber(maxOneRM, 0) * (1 + weeklyIncrement);

    setAutoAdaptiveMessage(
      `📈 Εβδομαδιαία αύξηση στόχου: δοκίμασε περίπου ${nextWeek.toFixed(1)} kg την επόμενη εβδομάδα, αν τα δεδομένα δεν βρωμάνε fatigue.`
    );

    if (effectiveRecovery !== null && effectiveRecovery < 3) {
      suggestion += " 🧘‍♂️ Recovery χαμηλό — καλύτερα έλεγχος, όχι μαγκιές.";
    } else if (effectiveRecovery !== null && effectiveRecovery >= 4.5) {
      suggestion += " 🚀 Σώμα έτοιμο — εδώ μπορείς να κυνηγήσεις πιο επιθετικό progression.";
    }

    setAiSuggestions(suggestion);
  }, [rpe, maxOneRM, rir, recoveryScore]);

  const oneRMExtremes = useMemo(() => {
    if (!logData.length) return null;

    return logData.reduce(
      (acc, cur) => {
        const currentValue = safeNumber(cur.maxOneRM, 0);
        const currentDate = formatDateLabel(cur.timestamp || cur.date);

        if (!acc.peak || currentValue > acc.peak.oneRM) {
          acc.peak = { oneRM: currentValue, date: currentDate };
        }
        if (!acc.dip || currentValue < acc.dip.oneRM) {
          acc.dip = { oneRM: currentValue, date: currentDate };
        }
        return acc;
      },
      { peak: null, dip: null }
    );
  }, [logData]);

  const recoveryChartData = useMemo(
    () =>
      recoveryLogs.map((entry) => ({
        name: formatDateLabel(entry.timestamp),
        recoveryScore: safeNumber(entry.recoveryScore, 0),
      })),
    [recoveryLogs]
  );

  const chartData = useMemo(
    () =>
      logData.map((entry) => ({
        name: formatDateLabel(entry.timestamp || entry.date),
        oneRM: safeNumber(entry.maxOneRM, 0),
        date: formatDateLabel(entry.timestamp || entry.date),
      })),
    [logData]
  );

  const combinedChartData = useMemo(() => {
    return logData.map((entry, index) => {
      const avgOneRM =
        logData
          .slice(0, index + 1)
          .reduce((acc, val) => acc + safeNumber(val.maxOneRM, 0), 0) /
        (index + 1);

      const entryDate = formatDateLabel(entry.timestamp || entry.date);

      const recoveryEntry = recoveryLogs.find(
        (r) => formatDateLabel(r.timestamp) === entryDate
      );

      return {
        name: entryDate,
        PR: safeNumber(entry.maxOneRM, 0),
        Avg: Number(avgOneRM.toFixed(1)),
        Recovery: recoveryEntry ? safeNumber(recoveryEntry.recoveryScore, 0) : null,
      };
    });
  }, [logData, recoveryLogs]);

  const adaptationSuggestion = useMemo(() => {
    const lastWeekData = combinedChartData.slice(-3);
    if (!lastWeekData.length) {
      return "📊 Δεν υπάρχουν αρκετά δεδομένα ακόμα για σοβαρή προσαρμογή φορτίου.";
    }

    const avgLastWeek =
      lastWeekData.reduce((acc, val) => acc + safeNumber(val.PR, 0), 0) / lastWeekData.length;

    const recoveryTrend = lastWeekData
      .map((d) => d.Recovery)
      .filter((val) => val !== null && val !== undefined);

    if (recoveryTrend.length === 3 && recoveryTrend.every((score) => score >= 4)) {
      return `💡 Καλή κατάσταση: μπορείς να προτείνεις αύξηση περίπου 2.5% στο φορτίο την επόμενη εβδομάδα (≈ ${Math.round(
        avgLastWeek * 1.025
      )} kg).`;
    }

    if (recoveryTrend.length === 3 && recoveryTrend.every((score) => score < 2.5)) {
      return "⚠️ Recovery χαμηλό συνεχόμενα — προτίμησε σταθεροποίηση ή ελαφρύ deload πριν το παίξεις ατσαλάκωτος.";
    }

    return "📊 Παρακολούθησε την πορεία και αναπροσάρμοσε εβδομαδιαία βάσει πραγματικών δεδομένων, όχι έμπνευσης.";
  }, [combinedChartData]);

  const latestStrengthValue =
    logData.length > 0 ? safeNumber(logData[logData.length - 1]?.maxOneRM, 0) : null;

  const latestRecoveryValue =
    recoveryLogs.length > 0
      ? safeNumber(recoveryLogs[recoveryLogs.length - 1]?.recoveryScore, 0)
      : null;

  const averageRecoveryValue =
    recoveryLogs.length > 0
      ? (
          recoveryLogs.reduce((acc, item) => acc + safeNumber(item.recoveryScore, 0), 0) /
          recoveryLogs.length
        ).toFixed(1)
      : null;

  const lowRecoveryStreak = useMemo(() => {
    let streak = 0;
    for (let i = recoveryLogs.length - 1; i >= 0; i -= 1) {
      if (safeNumber(recoveryLogs[i]?.recoveryScore, 0) < 2.5) streak += 1;
      else break;
    }
    return streak;
  }, [recoveryLogs]);

  const latestRecoveryTone = useMemo(
    () => getRecoveryTone(recoveryScore ?? latestRecoveryValue ?? 0),
    [recoveryScore, latestRecoveryValue]
  );

  const saveLogToSupabase = useCallback(
    async (type, data) => {
      if (!user?.id) {
        return {
          ok: false,
          localOnly: true,
          error: null,
        };
      }

      const basePayload = {
        type,
        ...data,
        timestamp: new Date().toISOString(),
      };

      let payload = { ...basePayload, user_id: user.id };
      let { error } = await supabase.from("strength_logs").insert([payload]);

      if (error && isUserIdColumnUnsupported(error)) {
        console.warn("Strength save falling back to legacy mode without user_id:", error);
        setScopeMode("legacy");
        payload = { ...basePayload };
        const fallback = await supabase.from("strength_logs").insert([payload]);
        error = fallback.error;
      } else {
        setScopeMode("scoped");
      }

      if (error) {
        console.error("Supabase logging error:", error);
        return {
          ok: false,
          localOnly: false,
          error,
        };
      }

      return {
        ok: true,
        localOnly: false,
        error: null,
      };
    },
    [user?.id]
  );

  const calculateOneRM = async () => {
    const w = safeNumber(weight, NaN);
    const r = safeNumber(reps, NaN);

    if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r < 1 || r > 10) {
      setError("⚠ Συμπλήρωσε σωστά βάρος (> 0) και επαναλήψεις (1–10).");
      setMaxOneRM(null);
      return;
    }

    setIsSavingOneRM(true);
    setError("");
    setErrorMessage("");
    setStatusMessage("");

    const result = w * (36 / (37 - r));
    const final = Number(result.toFixed(1));
    setMaxOneRM(final);

    const saveResult = await saveLogToSupabase("1RM", {
      weight: w,
      reps: r,
      maxOneRM: final,
      date: new Date().toISOString(),
      rpe: clamp(safeNumber(rpe, 7), 6, 10),
      rir: clamp(safeNumber(rir, 3), 0, 4),
    });

    if (saveResult.localOnly) {
      setStatusMessage(`✅ Το 1RM υπολογίστηκε τοπικά: ${final} kg. Συνδέσου για cloud history.`);
      pushNotification(`💪 Τοπικός υπολογισμός 1RM: ${final} kg`, "info");
      setIsSavingOneRM(false);
      return;
    }

    if (!saveResult.ok) {
      setErrorMessage("Αποτυχία αποθήκευσης 1RM.");
      setIsSavingOneRM(false);
      return;
    }

    setStatusMessage(`✅ Το 1RM αποθηκεύτηκε: ${final} kg.`);
    pushNotification(`💪 Νέα καταχώρηση 1RM: ${final} kg`, "success");
    setIsSavingOneRM(false);
    await fetchStrengthData();
  };

  const handleRpeRirChange = (value, type) => {
    const numeric = safeNumber(value, type === "rpe" ? 7 : 3);

    if (type === "rpe") {
      setRpe(String(clamp(numeric, 6, 10)));
    } else if (type === "rir") {
      setRir(String(clamp(numeric, 0, 4)));
    }
  };

  const calculateRecovery = async () => {
    const score =
      (safeNumber(stressData.sleep, 3) +
        safeNumber(stressData.energy, 3) +
        safeNumber(stressData.mood, 3) +
        (6 - safeNumber(stressData.pain, 3))) /
      4;

    const finalScore = Number(score.toFixed(1));
    setRecoveryScore(finalScore);
    setIsSavingRecovery(true);
    setStatusMessage("");
    setErrorMessage("");

    const saveResult = await saveLogToSupabase("Recovery", {
      ...stressData,
      recoveryScore: finalScore,
    });

    if (saveResult.localOnly) {
      setStatusMessage(
        `✅ Recovery Score υπολογίστηκε τοπικά: ${finalScore}/5. Συνδέσου για cloud history.`
      );
      pushNotification(`🧘 Recovery Score: ${finalScore}/5`, "info");
      setIsSavingRecovery(false);
      return;
    }

    if (!saveResult.ok) {
      setErrorMessage("Αποτυχία αποθήκευσης Recovery Score.");
      setIsSavingRecovery(false);
      return;
    }

    setStatusMessage(`✅ Recovery Score καταχωρήθηκε: ${finalScore}/5.`);
    pushNotification(`🧘 Recovery Score: ${finalScore}/5`, "success");
    setIsSavingRecovery(false);
    await fetchStrengthData();
  };

  const generateCoachAdvice = () => {
    const currentOneRM = safeNumber(maxOneRM, 0);
    const currentRecovery = recoveryScore ?? latestRecoveryValue ?? null;

    let advice = "🧠 AI Coach: ";

    if (!currentOneRM || currentRecovery === null) {
      advice += "Συμπλήρωσε πρώτα 1RM και Recovery για να βγει σοβαρή πρόταση.";
    } else if (currentRecovery < 3) {
      advice +=
        "Χαμηλό recovery. Προτίμησε ελαφρύ κύκλο, RPE 6–7, περισσότερο RIR και έλεγχο volume.";
    } else if (currentRecovery >= 4.5) {
      advice +=
        "Υψηλό recovery. Υπάρχει χώρος για PR attempt ή προοδευτική αύξηση φορτίου 2.5–5%, αν και η τεχνική είναι καθαρή.";
    } else {
      advice +=
        "Μέτρια κατάσταση. Κράτα το φορτίο λογικό, δες πώς αντιδρά το recovery και μη βαφτίζεις κάθε καλή μέρα peak.";
    }

    setCoachAdvice(advice);
  };

  const generateCyclePlan = () => {
    const currentOneRM = safeNumber(maxOneRM, 0);
    const currentRecovery = recoveryScore ?? latestRecoveryValue ?? null;

    if (!currentOneRM || currentRecovery === null) {
      setCyclePlan("🔁 Συμπλήρωσε 1RM και Recovery για να δημιουργηθεί πλάνο.");
      return;
    }

    let weekType = "Σταθερός Κύκλος";

    if (userCycleMode === "PR") {
      weekType = "Overload Εβδομάδα";
    } else if (userCycleMode === "Deload") {
      weekType = "Deload Εβδομάδα";
    } else if (currentRecovery < 3) {
      weekType = "Deload Εβδομάδα";
    } else if (prMessage) {
      weekType = "Overload Εβδομάδα";
    }

    const w = currentOneRM;
    const plan = `📅 ${weekType}

- Δευτέρα: Squat 4x6 @ ${(w * 0.75).toFixed(1)} kg (RPE 7)
- Τετάρτη: Bench Press 3x8 @ ${(w * 0.7).toFixed(1)} kg (RPE 7)
- Παρασκευή: Deadlift 3x5 @ ${(w * 0.8).toFixed(1)} kg (RPE 8)
- Κυριακή: Pull & Core 4x10 @ bodyweight ή light load

🎯 Προσαρμοσμένο βάσει τελευταίου 1RM και Recovery Score.`;

    setCyclePlan(plan);
  };

  const generateCycleTemplate = () => {
    const currentOneRM = safeNumber(maxOneRM, 0);

    if (!cycleType || !currentOneRM) {
      setCycleOutput("🔁 Επίλεξε τύπο κύκλου και υπολόγισε 1RM πρώτα.");
      return;
    }

    const w = currentOneRM;
    let output = `📊 ${cycleType} Periodization (4 εβδομάδες):\n`;

    const plans = {
      Linear: [0.7, 0.75, 0.8, 0.85],
      Undulating: [0.75, 0.8, 0.7, 0.85],
      Deload: [0.6, 0.65, 0.6, 0.5],
    };

    plans[cycleType].forEach((pct, i) => {
      output += `\nΕβδομάδα ${i + 1}:
- Squat 3x5 @ ${(w * pct).toFixed(1)}kg
- Bench 3x8 @ ${(w * (pct - 0.05)).toFixed(1)}kg
- Deadlift 2x5 @ ${(w * (pct + 0.05)).toFixed(1)}kg\n`;
    });

    setCycleOutput(output);
  };

  const exportCoachAdviceToPDF = async () => {
    if (isExportingCoachPdf) return;

    try {
      setIsExportingCoachPdf(true);
      const [{ default: jsPDF }] = await Promise.all([import("jspdf")]);

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("AI Coach Συμβουλή", 20, 20);
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(
        coachAdvice || "Δεν υπάρχει συμβουλή αυτή τη στιγμή.",
        170
      );
      doc.text(lines, 20, 32);
      doc.save("ai_coach_advice.pdf");
    } catch (error) {
      console.error("Coach PDF export failed:", error);
      alert("Αποτυχία εξαγωγής PDF.");
    } finally {
      setIsExportingCoachPdf(false);
    }
  };

  const exportAllLogsToPDF = async () => {
    if (isExportingAllLogsPdf) return;

    try {
      setIsExportingAllLogsPdf(true);

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Health's Spot - Όλα τα Strength Logs", 20, 20);

      autoTable(doc, {
        startY: 30,
        head: [["Ημερομηνία", "Τύπος", "1RM", "Recovery", "Weight", "Reps"]],
        body: allLogs.map((log) => [
          formatDateTime(log.timestamp || log.date || Date.now()),
          log.type || "",
          log.maxOneRM || "",
          log.recoveryScore || "",
          log.weight || "",
          log.reps || "",
        ]),
      });

      doc.save("strength_logs.pdf");
    } catch (error) {
      console.error("All logs PDF export failed:", error);
      alert("Αποτυχία εξαγωγής PDF.");
    } finally {
      setIsExportingAllLogsPdf(false);
    }
  };

  const exportAllLogsToCSV = () => {
    downloadCsv("strength_logs.csv", [
      ["Ημερομηνία", "Τύπος", "1RM", "Recovery", "Weight", "Reps"],
      ...allLogs.map((log) => [
        formatDateTime(log.timestamp || log.date || Date.now()),
        log.type || "",
        log.maxOneRM || "",
        log.recoveryScore || "",
        log.weight || "",
        log.reps || "",
      ]),
    ]);
  };

  const exportToCSV = () => {
    downloadCsv("strength_report.csv", [
      ["Metric", "Value"],
      ["Weight", `${weight || 0} kg`],
      ["Reps", reps || 1],
      ["1RM", maxOneRM || "Not calculated"],
      ["RPE", rpe],
      ["RIR", rir],
      ["Sleep", stressData.sleep],
      ["Energy", stressData.energy],
      ["Pain", stressData.pain],
      ["Mood", stressData.mood],
      ["Recovery Score", recoveryScore ?? latestRecoveryValue ?? "Not calculated"],
    ]);
  };

  const exportToPDF = async () => {
    if (isExportingReportPdf) return;

    try {
      setIsExportingReportPdf(true);

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Health's Spot - Strength Report", 20, 20);

      autoTable(doc, {
        startY: 30,
        head: [["Metric", "Value"]],
        body: [
          ["Weight", `${weight || 0} kg`],
          ["Reps", `${reps || 1}`],
          ["1RM", maxOneRM ? `${maxOneRM} kg` : "Not calculated"],
          ["RPE", rpe],
          ["RIR", rir],
          ["Sleep", stressData.sleep],
          ["Energy", stressData.energy],
          ["Pain", stressData.pain],
          ["Mood", stressData.mood],
          ["Recovery Score", recoveryScore ?? latestRecoveryValue ?? "Not calculated"],
        ],
      });

      doc.save("strength_report.pdf");
    } catch (error) {
      console.error("Strength report PDF export failed:", error);
      alert("Αποτυχία εξαγωγής PDF.");
    } finally {
      setIsExportingReportPdf(false);
    }
  };

  const exportCycleToPDF = async () => {
    if (isExportingCyclePdf) return;

    try {
      setIsExportingCyclePdf(true);
      const [{ default: jsPDF }] = await Promise.all([import("jspdf")]);

      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text("Cycle Generator Pro", 14, 20);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(cycleOutput || "Δεν υπάρχει cycle output.", 180);
      doc.text(lines, 14, 30);
      doc.save("cycle_plan.pdf");
    } catch (error) {
      console.error("Cycle PDF export failed:", error);
      alert("Αποτυχία εξαγωγής PDF.");
    } finally {
      setIsExportingCyclePdf(false);
    }
  };

  const exportCycleToCSV = () => {
    const rows = (cycleOutput || "")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => [line]);

    downloadCsv("cycle_plan.csv", rows.length ? rows : [["Δεν υπάρχει cycle output."]]);
  };

  const handleNewStrengthEntry = async (entry) => {
    if (!user?.id) {
      setErrorMessage("Συνδέσου για να αποθηκεύεται το strength session στο cloud.");
      pushNotification("🔒 Χρειάζεται login για αποθήκευση strength session.", "warn");
      return;
    }

    const payload = {
      ...entry,
      type: "Strength",
      timestamp: new Date().toISOString(),
    };

    const saveResult = await saveLogToSupabase("Strength", payload);

    if (saveResult.ok) {
      setStatusMessage("💪 Νέα strength καταχώρηση αποθηκεύτηκε.");
      pushNotification("💪 Νέα strength καταχώρηση αποθηκεύτηκε.", "success");
      await fetchStrengthData();
    } else {
      setErrorMessage("❌ Σφάλμα κατά την αποθήκευση strength session.");
      pushNotification("❌ Σφάλμα κατά την αποθήκευση strength session.", "error");
    }
  };

  const handleReset = () => {
    setWeight("");
    setReps("1");
    setRpe("7");
    setRir("3");
    setStressData(defaultStressData);
    setMaxOneRM(null);
    setRecoveryScore(null);
    setAiSuggestions("");
    setAutoAdaptiveMessage("");
    setCoachAdvice("");
    setCyclePlan("");
    setCycleOutput("");
    setError("");
    setRpeError("");
    setStatusMessage("");
    setErrorMessage("");
    localStorage.removeItem("strengthModuleData");
  };

  const panelClass = `rounded-2xl border shadow-lg backdrop-blur-sm p-5 md:p-6 ${
    theme === "dark"
      ? "bg-zinc-950/80 border-zinc-800 text-white"
      : "bg-white border-zinc-200 text-black"
  }`;

  const statCardClass = `rounded-2xl border p-4 ${
    theme === "dark"
      ? "bg-zinc-950/70 border-zinc-800"
      : "bg-zinc-50 border-zinc-200"
  }`;

  const inputClass = `w-full rounded-xl border px-3 py-2.5 outline-none transition ${
    theme === "dark"
      ? "bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-500"
      : "bg-white text-black border-zinc-300 placeholder:text-zinc-400"
  }`;

  const labelClass = `block mb-1 text-sm font-medium ${
    theme === "dark" ? "text-zinc-300" : "text-zinc-700"
  }`;

  const mutedTextClass = theme === "dark" ? "text-zinc-400" : "text-zinc-600";

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

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Loading Strength Lab...
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`min-h-screen px-4 py-8 md:px-6 xl:px-8 ${
        theme === "dark" ? "bg-black text-white" : "bg-zinc-50 text-black"
      }`}
    >
      <Helmet>
        <title>Strength Training | Health's Spot</title>
        <meta
          name="description"
          content="Υπολόγισε 1RM, RPE και Recovery score για την προπόνησή σου στο Strength Lab του Health's Spot."
        />
        <link rel="canonical" href="https://healthsspot.vercel.app/training" />
      </Helmet>

      <div className="mx-auto w-full max-w-7xl space-y-6">
        {!user?.id && (
          <div className={localNoticeClass}>
            Δεν έχεις συνδεθεί — calculations γίνονται κανονικά, αλλά cloud save και history θέλουν login.
          </div>
        )}

        {user?.id && scopeMode === "legacy" && (
          <div className={legacyNoticeClass}>
            Το `strength_logs` φαίνεται να λειτουργεί χωρίς `user_id`. Το module συνεχίζει σε legacy mode για να μην πεθάνει το flow, αλλά για σωστό per-user isolation θες column `user_id`.
          </div>
        )}

        {(statusMessage || errorMessage) && (
          <div className="space-y-2">
            {statusMessage && <div className={successClass}>{statusMessage}</div>}
            {errorMessage && <div className={errorClass}>{errorMessage}</div>}
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 md:text-4xl">Strength Lab</h1>
            <p className={`mt-1 text-sm md:text-base ${mutedTextClass}`}>
              1RM, fatigue context, recovery tracking και cycle planning χωρίς να μοιάζει με Excel που φόρεσε hoodie.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchStrengthData}
              disabled={isLoadingLogs}
              className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingLogs ? "Refreshing..." : <span className="inline-flex items-center gap-2"><RefreshCcw className="h-4 w-4" /> Refresh</span>}
            </button>

            <button
              onClick={toggleTheme}
              className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-600"
            >
              {theme === "dark" ? "☀ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={exportToPDF}
              disabled={isExportingReportPdf}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingReportPdf ? "Exporting..." : "📄 Report PDF"}
            </button>

            <button
              onClick={exportToCSV}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              📑 Report CSV
            </button>

            <button
              onClick={handleReset}
              className="rounded-xl bg-zinc-600 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              ♻ Reset
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Peak 1RM</p>
            <p className="mt-2 text-2xl font-bold text-yellow-400">
              {maxOneRM ? `${maxOneRM} kg` : "--"}
            </p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Τελευταίο 1RM</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {latestStrengthValue ? `${latestStrengthValue} kg` : "--"}
            </p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Avg Recovery</p>
            <p className="mt-2 text-2xl font-bold text-cyan-400">
              {averageRecoveryValue ? `${averageRecoveryValue}/5` : "--"}
            </p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Recovery Streak &lt; 2.5</p>
            <p className="mt-2 text-2xl font-bold text-rose-400">{lowRecoveryStreak || 0}</p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Sessions</p>
            <p className="mt-2 text-2xl font-bold text-pink-400">{logData.length}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <motion.section
              className={panelClass}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4 }}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-yellow-400">
                    Υπολογισμός 1RM (Brzycki)
                  </h2>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Βάλε πραγματικό load + reps και πάρε usable baseline, όχι κάτι “περίπου”.
                  </p>
                </div>
                {prMessage && (
                  <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">
                    Νέο PR
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Βάρος (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="π.χ. 100"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Επαναλήψεις (1–10)</label>
                  <input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    placeholder="π.χ. 5"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={calculateOneRM}
                  disabled={isSavingOneRM}
                  className="rounded-xl bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingOneRM ? "Saving..." : "Υπολόγισε 1RM"}
                </button>

                {maxOneRM && (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300">
                    1RM: {maxOneRM} kg
                  </div>
                )}
              </div>

              {error && <p className="mt-3 text-sm font-semibold text-red-400">{error}</p>}

              {(aiSuggestions || autoAdaptiveMessage) && (
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {aiSuggestions && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                      {aiSuggestions}
                    </div>
                  )}
                  {autoAdaptiveMessage && (
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-300">
                      {autoAdaptiveMessage}
                    </div>
                  )}
                </div>
              )}
            </motion.section>

            <motion.section
              className={panelClass}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.45 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-emerald-400">
                  📊 Strength vs Recovery
                </h2>
                <p className={`text-sm ${mutedTextClass}`}>
                  Το 1RM και το recovery δεν είναι το ίδιο μέγεθος, άρα δεν τα πετάμε στο ίδιο y-axis σαν βλάκες.
                </p>
              </div>

              {combinedChartData.length === 0 ? (
                <p className={mutedTextClass}>Δεν υπάρχουν δεδομένα ακόμα.</p>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={combinedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="strength" domain={["auto", "auto"]} />
                    <YAxis
                      yAxisId="recovery"
                      orientation="right"
                      domain={[1, 5]}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <ReferenceLine yAxisId="recovery" y={3} stroke="#f59e0b" strokeDasharray="4 4" />
                    <Line
                      yAxisId="strength"
                      type="monotone"
                      dataKey="PR"
                      stroke="#FACC15"
                      strokeWidth={3}
                      name="1RM PR"
                    />
                    <Line
                      yAxisId="strength"
                      type="monotone"
                      dataKey="Avg"
                      stroke="#34D399"
                      strokeWidth={2}
                      name="Μέσος 1RM"
                    />
                    <Line
                      yAxisId="recovery"
                      type="monotone"
                      dataKey="Recovery"
                      stroke="#60A5FA"
                      strokeWidth={2}
                      name="Recovery"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-300">
                {adaptationSuggestion}
              </div>
            </motion.section>

            <motion.section
              className={panelClass}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-green-400">📈 Εξέλιξη 1RM</h2>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Καθαρό ιστορικό δύναμης, όχι διπλά sections που ξαναλένε το ίδιο ποίημα.
                  </p>
                </div>
              </div>

              {logData.length > 0 ? (
                <div className="space-y-4">
                  <StrengthChart data={chartData} prValue={maxOneRM} />

                  {oneRMExtremes?.peak && oneRMExtremes?.dip && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                        📈 Peak 1RM: {oneRMExtremes.peak.oneRM} kg ({oneRMExtremes.peak.date})
                      </div>
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                        📉 Χαμηλότερο 1RM: {oneRMExtremes.dip.oneRM} kg ({oneRMExtremes.dip.date})
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className={mutedTextClass}>Δεν υπάρχουν δεδομένα για εμφάνιση.</p>
              )}
            </motion.section>

            <motion.section
              className={panelClass}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.52 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">💪 Καταχώρηση Strength Session</h2>
                <p className={`text-sm ${mutedTextClass}`}>
                  Το form κάθεται σε κανονικό panel και στέλνει log χωρίς να μοιάζει με appendix.
                </p>
              </div>

              <StrengthForm onNewEntry={handleNewStrengthEntry} />
            </motion.section>
          </div>

          <div className="space-y-6 xl:col-span-5">
            <motion.section
              className={panelClass}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4 }}
            >
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-purple-400">
                RPE / RIR Tool
                <Info
                  className="h-4 w-4 text-purple-300"
                  title="RPE: Εκτιμώμενη αντίληψη δυσκολίας (6–10). RIR: Πόσες επαναλήψεις απομένουν πριν την εξάντληση (0–4)."
                />
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>RPE</label>
                  <select
                    value={rpe}
                    onChange={(e) => handleRpeRirChange(e.target.value, "rpe")}
                    className={inputClass}
                  >
                    {[...Array(5)].map((_, i) => (
                      <option key={i} value={i + 6}>
                        {i + 6}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>RIR</label>
                  <select
                    value={rir}
                    onChange={(e) => handleRpeRirChange(e.target.value, "rir")}
                    className={inputClass}
                  >
                    {[...Array(5)].map((_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {rpeError && <p className="mt-3 text-sm font-semibold text-red-400">{rpeError}</p>}
            </motion.section>

            <motion.section
              className={panelClass}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.45 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-blue-400">🧘 Recovery Score</h2>
                <p className={`text-sm ${mutedTextClass}`}>
                  Recovery panel σωστού πλάτους, όχι 4 sliders χαμένα στο διάστημα.
                </p>
              </div>

              <div className="space-y-4">
                {["sleep", "energy", "mood", "pain"].map((key) => (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between">
                      <label className={labelClass}>
                        {key === "sleep"
                          ? "Ύπνος"
                          : key === "energy"
                          ? "Ενέργεια"
                          : key === "mood"
                          ? "Διάθεση"
                          : "Πόνος"}
                      </label>
                      <span className={`text-sm ${mutedTextClass}`}>{stressData[key]}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={stressData[key]}
                      onChange={(e) =>
                        setStressData({
                          ...stressData,
                          [key]: clamp(safeNumber(e.target.value, 3), 1, 5),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={calculateRecovery}
                  disabled={isSavingRecovery}
                  className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingRecovery ? "Saving..." : "Υπολόγισε Recovery Score"}
                </button>

                <div className={`rounded-xl border px-4 py-2 text-sm font-semibold ${latestRecoveryTone.className}`}>
                  {latestRecoveryTone.label}: {recoveryScore ?? latestRecoveryValue ?? "--"}
                </div>
              </div>

              <p className={`mt-3 text-sm ${mutedTextClass}`}>{latestRecoveryTone.message}</p>
            </motion.section>

            <motion.section
              className={panelClass}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-cyan-400">Ιστορικό Recovery</h2>
              </div>

              {recoveryChartData.length === 0 ? (
                <p className={mutedTextClass}>Δεν υπάρχουν δεδομένα ακόμα.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={recoveryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[1, 5]} allowDecimals={false} />
                    <Tooltip />
                    <ReferenceLine y={3} stroke="#f59e0b" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="recoveryScore"
                      stroke="#06B6D4"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.section>

            <motion.section
              className={panelClass}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55 }}
            >
              <h2 className="mb-4 text-xl font-semibold text-amber-400">🧠 AI Coach</h2>

              <div className="mb-4">
                <label className={labelClass}>Mode</label>
                <select
                  value={userCycleMode}
                  onChange={(e) => setUserCycleMode(e.target.value)}
                  className={inputClass}
                >
                  <option value="Auto">🤖 Auto Mode</option>
                  <option value="PR">🏋 PR Week</option>
                  <option value="Deload">🧘 Deload Week</option>
                </select>
              </div>

              <button
                onClick={generateCoachAdvice}
                className="rounded-xl bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-600"
              >
                Προπονητική Συμβουλή
              </button>

              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
                {coachAdvice || "Δεν υπάρχουν συμβουλές ακόμη."}
              </div>

              {coachAdvice && (
                <div className="mt-4">
                  <button
                    onClick={exportCoachAdviceToPDF}
                    disabled={isExportingCoachPdf}
                    className="rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isExportingCoachPdf ? "Exporting..." : "📤 Export Coach PDF"}
                  </button>
                </div>
              )}
            </motion.section>

            <motion.section
              className={panelClass}
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-4 text-xl font-semibold text-pink-300">🔁 Cycle Builder</h2>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>1RM</label>
                  <input
                    type="number"
                    value={maxOneRM || ""}
                    onChange={(e) =>
                      setMaxOneRM(e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className={inputClass}
                    placeholder="π.χ. 100"
                  />
                </div>

                <div>
                  <label className={labelClass}>Τύπος Κύκλου</label>
                  <select
                    value={cycleType}
                    onChange={(e) => setCycleType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Linear">Linear</option>
                    <option value="Undulating">Undulating</option>
                    <option value="Deload">Deload</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={generateCyclePlan}
                    className="rounded-xl bg-pink-500 px-4 py-2 font-semibold text-black hover:bg-pink-600"
                  >
                    Εβδομαδιαίο πλάνο
                  </button>

                  <button
                    onClick={generateCycleTemplate}
                    className="rounded-xl bg-fuchsia-600 px-4 py-2 font-semibold text-white hover:bg-fuchsia-700"
                  >
                    4-εβδομαδιαίος κύκλος
                  </button>
                </div>

                {cyclePlan && (
                  <pre className="whitespace-pre-wrap rounded-xl border border-pink-500/20 bg-pink-500/10 p-4 text-sm text-pink-200">
                    {cyclePlan}
                  </pre>
                )}

                {cycleOutput && (
                  <>
                    <pre className="whitespace-pre-wrap rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-200">
                      {cycleOutput}
                    </pre>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={exportCycleToPDF}
                        disabled={isExportingCyclePdf}
                        className="rounded-xl bg-fuchsia-600 px-4 py-2 font-semibold text-white hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isExportingCyclePdf ? "Exporting..." : "Cycle PDF"}
                      </button>

                      <button
                        onClick={exportCycleToCSV}
                        className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                      >
                        Cycle CSV
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.section>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <div className={panelClass}>
              <h2 className="mb-4 text-xl font-semibold text-indigo-300">📦 Exports</h2>

              <div className="flex flex-wrap gap-2">
                {allLogs.length > 0 && (
                  <>
                    <button
                      onClick={exportAllLogsToPDF}
                      disabled={isExportingAllLogsPdf}
                      className="rounded-xl bg-fuchsia-600 px-4 py-2 font-semibold text-white hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isExportingAllLogsPdf ? "Exporting..." : "🧾 All Logs PDF"}
                    </button>

                    <button
                      onClick={exportAllLogsToCSV}
                      className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                    >
                      📂 All Logs CSV
                    </button>
                  </>
                )}
              </div>

              <div className="mt-4">
                <ExportButtons logData={logData} />
              </div>
            </div>
          </div>

          <div className="xl:col-span-5">
            <div className={panelClass}>
              <h2 className="mb-4 text-xl font-semibold text-sky-300">🧪 Recovery Tracker</h2>
              <RecoveryTracker recoveryData={recoveryLogs} />
            </div>
          </div>
        </section>

        {notifications.length > 0 && (
          <div className="fixed right-3 top-3 z-50 space-y-2">
            {notifications.map((note) => (
              <div
                key={note.id}
                className={`rounded-xl border px-4 py-3 shadow-lg ${
                  note.tone === "error"
                    ? "border-rose-300 bg-rose-100 text-rose-900"
                    : note.tone === "warn"
                    ? "border-yellow-300 bg-yellow-100 text-yellow-900"
                    : note.tone === "success"
                    ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                    : "border-sky-300 bg-sky-100 text-sky-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium">{note.text}</span>
                  <button
                    onClick={() => dismissNotification(note.id)}
                    className="text-sm font-bold"
                  >
                    ✖
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
