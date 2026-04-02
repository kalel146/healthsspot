import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";
import { Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "./supabaseClient";
import StrengthForm from "./StrengthForm";
import StrengthChart from "./StrengthChart";
import RecoveryTracker from "./RecoveryTracker";
import ExportButtons from "./ExportButtons";

const pageVariants = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  in: { opacity: 1, y: 0, scale: 1 },
  out: { opacity: 0, y: -50, scale: 0.95 },
};

const pageTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const defaultStressData = { sleep: 3, energy: 3, pain: 3, mood: 3 };

export default function StrengthModule() {
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(1);
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
  const { theme, toggleTheme } = useTheme();

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

  const pushNotification = (text) => {
    setNotifications((prev) => [...prev, { id: Date.now() + Math.random(), text }]);
  };

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const fetchStrengthData = useCallback(async () => {
    const { data, error } = await supabase
      .from("strength_logs")
      .select("*")
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("❌ Error fetching strength data:", error);
      return;
    }

    const logs = data || [];
    setAllLogs(logs);

    const strengthEntries = logs.filter(
      (entry) =>
        entry.type !== "Recovery" &&
        (entry.maxOneRM !== null ||
          entry.maxOneRM !== undefined ||
          entry.type === "Strength" ||
          entry.type === "1RM")
    );

    const recoveryEntries = logs.filter((entry) => entry.type === "Recovery");

    setLogData(strengthEntries);
    setRecoveryLogs(recoveryEntries);

    const best = strengthEntries.reduce(
      (max, entry) => Math.max(max, parseFloat(entry.maxOneRM || 0)),
      0
    );
    setMaxOneRM(best || null);

    if (strengthEntries.length > 0) {
      const latest = parseFloat(
        strengthEntries[strengthEntries.length - 1]?.maxOneRM || 0
      );
      if (latest && latest === best) {
        setPrMessage("🎉 Νέο PR καταγράφηκε! Συγχαρητήρια!");
      } else {
        setPrMessage("");
      }
    } else {
      setPrMessage("");
    }
  }, []);

  useEffect(() => {
    fetchStrengthData();
  }, [fetchStrengthData]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("strengthModuleData");
      if (saved) {
        const data = JSON.parse(saved);
        setWeight(data.weight || 0);
        setReps(data.reps || 1);
        setRpe(data.rpe || "7");
        setRir(data.rir || "3");
        setStressData(data.stressData || defaultStressData);
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
    if (prMessage) pushNotification("🎯 Νέο PR! Καταγράφηκε επιτυχώς.");
    if (recoveryScore && recoveryScore < 2.5) {
      pushNotification("🛑 Πολύ χαμηλό Recovery — Deload προτείνεται.");
    }
  }, [prMessage, recoveryScore]);

  useEffect(() => {
    if (logData.length >= 3) {
      const lastThree = logData.slice(-3).map((e) => parseFloat(e.maxOneRM || 0));
      const allEqual = lastThree.every((val) => val === lastThree[0]);
      const allDecreasing =
        lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2];

      if (allEqual) {
        pushNotification(
          "⚠ Στασιμότητα 1RM σε 3 σερί sessions – Δοκίμασε μεταβλητότητα φορτίου."
        );
      }
      if (allDecreasing) {
        pushNotification(
          "🔻 Πτώση σε 1RM για 3 sessions – Επανεξέτασε το πρόγραμμα και recovery."
        );
      }
    }

    if (recoveryLogs.length >= 4) {
      const lowRecovery = recoveryLogs
        .slice(-4)
        .every((e) => parseFloat(e.recoveryScore || 0) < 2.5);

      if (lowRecovery) {
        pushNotification(
          "🧘‍♂️ Recovery Score <2.5 για 4 ημέρες – Deload + active recovery προτείνεται."
        );
      }
    }
  }, [logData, recoveryLogs]);

  useEffect(() => {
    if (maxOneRM && rpe && rir) {
      const intensity = parseFloat(maxOneRM) * (1 - parseInt(rir, 10) * 0.03);
      let suggestion = `💡 Πρόταση: Φόρτωσε περίπου ${intensity.toFixed(
        1
      )} kg για ${10 - parseInt(rir, 10)} επαναλήψεις (RPE ${rpe}, RIR ${rir}).`;

      const weeklyIncrement = 0.02;
      const nextWeek = parseFloat(maxOneRM) * (1 + weeklyIncrement);
      setAutoAdaptiveMessage(
        `📈 Εβδομαδιαία αύξηση στόχου: Δοκίμασε ~${nextWeek.toFixed(
          1
        )} kg την επόμενη εβδομάδα.`
      );

      if (recoveryScore && recoveryScore < 3) {
        suggestion +=
          " 🧘‍♂️ Πρόσεξε την αποκατάσταση — ίσως είναι μέρα για deload ή active recovery.";
      } else if (recoveryScore && recoveryScore >= 4.5) {
        suggestion += " 🚀 Είσαι σε top φόρμα — ώρα για νέα PRs!";
      }

      setAiSuggestions(suggestion);
    } else {
      setAiSuggestions("");
      setAutoAdaptiveMessage("");
    }
  }, [rpe, maxOneRM, rir, recoveryScore]);

  const oneRMExtremes = useMemo(() => {
    if (!logData.length) return null;

    return logData.reduce(
      (acc, cur) => {
        const currentValue = parseFloat(cur.maxOneRM || 0);
        const currentDate = new Date(
          cur.timestamp || cur.date || Date.now()
        ).toLocaleDateString("el-GR");

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
        name: new Date(entry.timestamp).toLocaleDateString("el-GR"),
        recoveryScore: parseFloat(entry.recoveryScore || 0),
      })),
    [recoveryLogs]
  );

  const chartData = useMemo(
    () =>
      logData.map((entry) => ({
        name: new Date(entry.timestamp || entry.date).toLocaleDateString("el-GR"),
        oneRM: parseFloat(entry.maxOneRM || 0),
        date: new Date(entry.timestamp || entry.date).toLocaleDateString("el-GR"),
      })),
    [logData]
  );

  const combinedChartData = useMemo(() => {
    return logData.map((entry, index) => {
      const avgOneRM =
        logData
          .slice(0, index + 1)
          .reduce((acc, val) => acc + parseFloat(val.maxOneRM || 0), 0) /
        (index + 1);

      const entryDate = new Date(entry.timestamp || entry.date).toLocaleDateString(
        "el-GR"
      );

      const recoveryEntry = recoveryLogs.find(
        (r) =>
          new Date(r.timestamp).toLocaleDateString("el-GR") === entryDate
      );

      return {
        name: entryDate,
        PR: parseFloat(entry.maxOneRM || 0),
        Avg: parseFloat(avgOneRM.toFixed(1)),
        Recovery: recoveryEntry
          ? parseFloat(recoveryEntry.recoveryScore || 0)
          : null,
      };
    });
  }, [logData, recoveryLogs]);

  const adaptationSuggestion = useMemo(() => {
    const lastWeekData = combinedChartData.slice(-3);
    if (!lastWeekData.length) {
      return "📊 Δεν υπάρχουν αρκετά δεδομένα ακόμα για προσαρμογή φορτίου.";
    }

    const avgLastWeek =
      lastWeekData.reduce((acc, val) => acc + val.PR, 0) / lastWeekData.length;
    const recoveryTrend = lastWeekData
      .map((d) => d.Recovery)
      .filter((val) => val !== null && val !== undefined);

    if (recoveryTrend.length === 3 && recoveryTrend.every((score) => score >= 4)) {
      return `💡 Είσαι σε καλή κατάσταση! Πρότεινε αύξηση ~2.5% στο φορτίο την επόμενη εβδομάδα (δηλ. ${Math.round(
        avgLastWeek * 1.025
      )} kg).`;
    }

    if (recoveryTrend.length === 3 && recoveryTrend.every((score) => score < 2.5)) {
      return "⚠️ Χαμηλή αποκατάσταση τις τελευταίες μέρες. Πρότεινε σταθεροποίηση ή ελαφρύ deload πριν συνεχίσεις.";
    }

    return "📊 Παρακολούθησε την πορεία και αναπροσάρμοσε εβδομαδιαία βάσει δεδομένων.";
  }, [combinedChartData]);

  const generateCoachAdvice = () => {
    let advice = "🧠 AI Coach: ";

    if (!maxOneRM || !recoveryScore) {
      advice += "Συμπλήρωσε πρώτα 1RM και Recovery για να λάβεις προτάσεις.";
    } else if (recoveryScore < 3) {
      advice +=
        "Χαμηλό recovery. Προτείνεται ελαφρύς κύκλος με RPE 6-7 και υψηλότερο RIR.";
    } else if (recoveryScore >= 4.5) {
      advice +=
        "Υψηλό recovery. Μπορείς να προχωρήσεις με κύκλο PR ή αύξηση φορτίου +5%.";
    } else {
      advice +=
        "Μέτρια κατάσταση. Διατήρησε το φορτίο σταθερό και παρακολούθησε RPE/Recovery.";
    }

    setCoachAdvice(advice);
  };

  const generateCyclePlan = () => {
    if (!maxOneRM || !recoveryScore) {
      setCyclePlan("🔁 Συμπλήρωσε 1RM και Recovery για να δημιουργηθεί πρόγραμμα.");
      return;
    }

    let weekType = "Σταθερός Κύκλος";

    if (userCycleMode === "PR") {
      weekType = "Overload Εβδομάδα";
    } else if (userCycleMode === "Deload") {
      weekType = "Deload Εβδομάδα";
    } else if (recoveryScore < 3) {
      weekType = "Deload Εβδομάδα";
    } else if (prMessage) {
      weekType = "Overload Εβδομάδα";
    }

    const w = parseFloat(maxOneRM);
    const plan = `📅 ${weekType}

- Δευτέρα: Squat 4x6 @ ${(w * 0.75).toFixed(1)} kg (RPE 7)
- Τετάρτη: Bench Press 3x8 @ ${(w * 0.7).toFixed(1)} kg (RPE 7)
- Παρασκευή: Deadlift 3x5 @ ${(w * 0.8).toFixed(1)} kg (RPE 8)
- Κυριακή: Pull & Core 4x10 @ bodyweight ή light

🎯 Προσαρμοσμένο βάσει τελευταίου 1RM και Recovery Score.`;

    setCyclePlan(plan);
  };

  const generateCycleTemplate = () => {
    if (!cycleType || isNaN(parseFloat(maxOneRM)) || parseFloat(maxOneRM) <= 0) {
      setCycleOutput("🔁 Επίλεξε τύπο κύκλου και υπολόγισε 1RM πρώτα.");
      return;
    }

    const w = parseFloat(maxOneRM);
    let output = `📊 ${cycleType} Periodization (4 εβδομάδες):\n`;

    const plans = {
      Linear: [0.7, 0.75, 0.8, 0.85],
      Undulating: [0.75, 0.8, 0.7, 0.85],
      Deload: [0.6, 0.65, 0.6, 0.5],
    };

    plans[cycleType].forEach((pct, i) => {
      output += `\nΕβδομάδα ${i + 1}:\n- Squat 3x5 @ ${(w * pct).toFixed(
        1
      )}kg\n- Bench 3x8 @ ${(w * (pct - 0.05)).toFixed(
        1
      )}kg\n- Deadlift 2x5 @ ${(w * (pct + 0.05)).toFixed(1)}kg\n`;
    });

    setCycleOutput(output);
  };

  const logToSupabase = async (type, data) => {
    const { error } = await supabase.from("strength_logs").insert([
      {
        type,
        ...data,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Supabase logging error:", error);
    }
  };

  const calculateOneRM = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);

    if (isNaN(w) || isNaN(r) || w <= 0 || r < 1 || r > 10) {
      setError("⚠ Συμπλήρωσε σωστά το βάρος (> 0) και τις επαναλήψεις (1-10).");
      setMaxOneRM(null);
      return;
    }

    setError("");
    const result = w * (36 / (37 - r));
    const final = result.toFixed(1);
    setMaxOneRM(Number(final));

    await logToSupabase("1RM", {
      weight: w,
      reps: r,
      maxOneRM: final,
      date: new Date().toISOString(),
    });

    await fetchStrengthData();
  };

  const handleRpeRirChange = (value, type) => {
    if (type === "rpe") {
      setRpe(value);
      setRpeError(parseInt(value, 10) < 6 ? "⚠ Το RPE πρέπει να είναι ≥ 6." : "");
    } else if (type === "rir") {
      setRir(value);
      setRpeError(parseInt(value, 10) > 4 ? "⚠ Το RIR πρέπει να είναι ≤ 4." : "");
    }
  };

  const calculateRecovery = async () => {
    const score =
      (parseInt(stressData.sleep, 10) +
        parseInt(stressData.energy, 10) +
        parseInt(stressData.mood, 10) +
        (6 - parseInt(stressData.pain, 10))) /
      4;

    const finalScore = parseFloat(score.toFixed(1));
    setRecoveryScore(finalScore);

    const { error } = await supabase.from("strength_logs").insert([
      {
        type: "Recovery",
        ...stressData,
        recoveryScore: finalScore,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (!error) {
      pushNotification(`✅ Recovery Score καταχωρήθηκε: ${finalScore}`);
      await fetchStrengthData();
    }
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
      doc.text(coachAdvice || "Δεν υπάρχει συμβουλή αυτή τη στιγμή.", 20, 30);
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
          new Date(log.timestamp || log.date || Date.now()).toLocaleString("el-GR"),
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
    const headers = ["Ημερομηνία", "Τύπος", "1RM", "Recovery", "Weight", "Reps"];

    const rows = allLogs.map((log) => [
      new Date(log.timestamp || log.date || Date.now()).toLocaleString("el-GR"),
      log.type || "",
      log.maxOneRM || "",
      log.recoveryScore || "",
      log.weight || "",
      log.reps || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "strength_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = () => {
    const rows = [
      ["Weight", `${weight} kg`],
      ["Reps", reps],
      ["1RM", maxOneRM || "Not calculated"],
      ["RPE", rpe],
      ["RIR", rir],
      ["Sleep", stressData.sleep],
      ["Energy", stressData.energy],
      ["Pain", stressData.pain],
      ["Mood", stressData.mood],
      ["Recovery Score", recoveryScore || "Not calculated"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "strength_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          ["Weight", `${weight} kg`],
          ["Reps", `${reps}`],
          ["1RM", maxOneRM ? `${maxOneRM} kg` : "Not calculated"],
          ["RPE", rpe],
          ["RIR", rir],
          ["Sleep", stressData.sleep],
          ["Energy", stressData.energy],
          ["Pain", stressData.pain],
          ["Mood", stressData.mood],
          ["Recovery Score", recoveryScore || "Not calculated"],
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
      doc.text(cycleOutput || "Δεν υπάρχει cycle output.", 14, 30);
      doc.save("cycle_plan.pdf");
    } catch (error) {
      console.error("Cycle PDF export failed:", error);
      alert("Αποτυχία εξαγωγής PDF.");
    } finally {
      setIsExportingCyclePdf(false);
    }
  };

  const exportCycleToCSV = () => {
    const rows = cycleOutput
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => [line]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cycle_plan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNewStrengthEntry = async (entry) => {
    const payload = {
      ...entry,
      type: "Strength",
      timestamp: new Date().toISOString(),
    };

    const { error } = await supabase.from("strength_logs").insert([payload]);

    if (!error) {
      pushNotification("💪 Νέα strength καταχώρηση αποθηκεύτηκε!");
      await fetchStrengthData();
    } else {
      pushNotification("❌ Σφάλμα κατά την αποθήκευση!");
      console.error(error);
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`min-h-screen px-4 py-10 flex justify-center items-start ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
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

      <div className="w-full max-w-screen-sm space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-yellow-400">Strength Lab</h1>
          <button
            onClick={toggleTheme}
            className="text-sm px-3 py-1 rounded bg-yellow-500 text-black hover:bg-yellow-600 font-semibold"
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={exportToPDF}
            disabled={isExportingReportPdf}
            className="px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExportingReportPdf ? "Exporting..." : "📄 Εξαγωγή PDF"}
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded bg-blue-500 text-white font-semibold hover:bg-blue-600"
          >
            📑 Εξαγωγή CSV
          </button>
        </div>

        <button
          onClick={() => {
            setWeight(0);
            setReps(1);
            setRpe("7");
            setRir("3");
            setStressData(defaultStressData);
            setMaxOneRM(null);
            setRecoveryScore(null);
            setAiSuggestions("");
            setAutoAdaptiveMessage("");
            localStorage.removeItem("strengthModuleData");
          }}
          className="px-4 py-2 rounded bg-gray-500 text-white font-semibold hover:bg-gray-600"
        >
          ♻ Reset
        </button>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-yellow-400">
            Υπολογισμός 1RM (Brzycki)
          </h2>

          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Βάρος (kg)"
            className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
          />

          {prMessage && <p className="text-green-400 font-bold">{prMessage}</p>}

          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="Επαναλήψεις (1-10)"
            className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
          />

          {aiSuggestions && (
            <p className="text-green-500 font-semibold mt-2">{aiSuggestions}</p>
          )}

          {autoAdaptiveMessage && (
            <p className="text-cyan-400 font-semibold">{autoAdaptiveMessage}</p>
          )}

          <button
            onClick={calculateOneRM}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold"
          >
            Υπολόγισε 1RM
          </button>

          {error && <p className="text-red-500 font-semibold">{error}</p>}
          {maxOneRM && <p className="text-lg font-bold">1RM: {maxOneRM} kg</p>}
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2 className="text-xl font-semibold text-emerald-400">
            📊 Strength Comparison Chart
          </h2>

          {combinedChartData.length === 0 ? (
            <p className="text-gray-400">Δεν υπάρχουν δεδομένα ακόμα.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={combinedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="PR"
                  stroke="#FACC15"
                  strokeWidth={2}
                  name="1RM PR"
                />
                <Line
                  type="monotone"
                  dataKey="Avg"
                  stroke="#34D399"
                  strokeWidth={2}
                  name="Μέσος 1RM"
                />
                <Line
                  type="monotone"
                  dataKey="Recovery"
                  stroke="#60A5FA"
                  strokeWidth={2}
                  name="Recovery"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          <p className="mt-4 text-sm text-amber-400 font-medium">
            {adaptationSuggestion}
          </p>
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 1 }}
        >
          <h2 className="text-xl font-semibold text-pink-400">
            🔁 Πρόγραμμα Εβδομάδας
          </h2>
          <button
            onClick={generateCyclePlan}
            className="bg-pink-500 hover:bg-pink-600 text-black font-semibold px-4 py-2 rounded mb-2"
          >
            Δημιουργία Κύκλου
          </button>

          {cyclePlan && (
            <pre className="mt-2 text-pink-200 whitespace-pre-wrap font-mono">
              {cyclePlan}
            </pre>
          )}
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-purple-400 flex items-center gap-2">
            RPE / RIR Tool
            <Info
              className="w-4 h-4 text-purple-300"
              title="RPE: Εκτιμώμενη αντίληψη δυσκολίας (6–10). RIR: Πόσες επαναλήψεις μένουν πριν την εξάντληση (0–4)."
            />
          </h2>

          <div>
            <label className="block font-medium">RPE:</label>
            <select
              value={rpe}
              onChange={(e) => handleRpeRirChange(e.target.value, "rpe")}
              className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
            >
              {[...Array(5)].map((_, i) => (
                <option key={i} value={i + 6}>
                  {i + 6}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium">RIR:</label>
            <select
              value={rir}
              onChange={(e) => handleRpeRirChange(e.target.value, "rir")}
              className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
            >
              {[...Array(5)].map((_, i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          {rpeError && <p className="text-red-500 font-semibold">{rpeError}</p>}
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-pink-300">
            📈 Cycle Generator Pro
          </h2>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Καταχώρησε 1RM:</label>
            <input
              type="number"
              value={maxOneRM || ""}
              onChange={(e) =>
                setMaxOneRM(e.target.value ? parseFloat(e.target.value) : null)
              }
              className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
              placeholder="π.χ. 100"
            />
          </div>

          <div className="mb-3">
            <label className="block mb-1 font-medium">Επίλεξε Τύπο Κύκλου:</label>
            <select
              value={cycleType}
              onChange={(e) => setCycleType(e.target.value)}
              className="w-full p-2 rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
            >
              <option value="Linear">Linear</option>
              <option value="Undulating">Undulating</option>
              <option value="Deload">Deload</option>
            </select>
          </div>

          <button
            onClick={generateCycleTemplate}
            className="bg-pink-500 hover:bg-pink-600 text-black font-semibold px-4 py-2 rounded mb-2"
          >
            Δημιουργία 4-Εβδομαδιαίου Κύκλου
          </button>

          {cycleOutput && (
            <>
              <pre className="mt-2 text-pink-200 whitespace-pre-wrap font-mono">
                {cycleOutput}
              </pre>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={exportCycleToPDF}
                  disabled={isExportingCyclePdf}
                  className="px-4 py-2 rounded bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExportingCyclePdf ? "Exporting..." : "Export σε PDF"}
                </button>
                <button
                  onClick={exportCycleToCSV}
                  className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                >
                  Export σε CSV
                </button>
              </div>
            </>
          )}
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-blue-400">🧘 Recovery Score</h2>

          {["sleep", "energy", "mood", "pain"].map((key) => (
            <div key={key}>
              <label className="block font-medium capitalize">{key}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={stressData[key]}
                onChange={(e) =>
                  setStressData({ ...stressData, [key]: e.target.value })
                }
                className="w-full"
              />
              <p className="text-sm text-gray-400">
                Τρέχουσα τιμή: {stressData[key]}
              </p>
            </div>
          ))}

          <button
            onClick={calculateRecovery}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            Υπολόγισε Recovery Score
          </button>

          {recoveryScore && (
            <p className="mt-2 text-blue-300 font-medium">
              Recovery Score: {recoveryScore}
            </p>
          )}
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-cyan-400">
            Ιστορικό Recovery Score
          </h2>

          {recoveryChartData.length === 0 ? (
            <p className="text-gray-400">Δεν υπάρχουν δεδομένα ακόμα.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={recoveryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
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
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="text-xl font-semibold text-amber-400">🧠 AI Coach</h2>

          <div className="mb-4">
            <label className="block font-medium text-sm mb-1">
              🎛 Επιλογή Mode:
            </label>
            <select
              value={userCycleMode}
              onChange={(e) => setUserCycleMode(e.target.value)}
              className="p-2 rounded w-full bg-gray-100 dark:bg-gray-800 dark:text-white"
            >
              <option value="Auto">🤖 Auto Mode</option>
              <option value="PR">🏋 PR Week</option>
              <option value="Deload">🧘 Deload Week</option>
            </select>
          </div>

          <button
            onClick={generateCoachAdvice}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded mb-2"
          >
            Προπονητική Συμβουλή
          </button>

          {coachAdvice && (
            <p className="mt-2 text-amber-300 font-medium">{coachAdvice}</p>
          )}
        </motion.section>

        <RecoveryTracker recoveryData={logData} />

        {coachAdvice && (
          <div className="mt-2 flex space-x-2 items-center">
            <button
              onClick={exportCoachAdviceToPDF}
              disabled={isExportingCoachPdf}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExportingCoachPdf ? "Exporting..." : "📤 Export Coach σε PDF"}
            </button>
            <p className="text-amber-300 font-medium">{coachAdvice}</p>
          </div>
        )}

        {allLogs.length > 0 && (
          <div className="flex justify-end space-x-3">
            <button
              onClick={exportAllLogsToPDF}
              disabled={isExportingAllLogsPdf}
              className="px-4 py-2 rounded bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExportingAllLogsPdf ? "Exporting..." : "🧾 Export Όλων (PDF)"}
            </button>
            <button
              onClick={exportAllLogsToCSV}
              className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              📂 Export Όλων (CSV)
            </button>
          </div>
        )}

        <ExportButtons logData={logData} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <StrengthForm onNewEntry={handleNewStrengthEntry} />
        </motion.div>

        {!logData ? (
          <p>Φορτώνει δεδομένα...</p>
        ) : (
          <motion.section
            className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-green-400">📈 Εξέλιξη 1RM</h2>

            {logData.length > 0 ? (
              <div>
                <StrengthChart data={chartData} prValue={maxOneRM} />
                {prMessage && (
                  <p className="text-green-400 font-medium mt-2">{prMessage}</p>
                )}

                {oneRMExtremes?.peak && oneRMExtremes?.dip && (
                  <ul className="text-sm text-gray-400 mt-3 list-disc ml-5">
                    <li>
                      📈 Peak 1RM: {oneRMExtremes.peak.oneRM} kg (
                      {oneRMExtremes.peak.date})
                    </li>
                    <li>
                      📉 Χαμηλότερο 1RM: {oneRMExtremes.dip.oneRM} kg (
                      {oneRMExtremes.dip.date})
                    </li>
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Δεν υπάρχουν δεδομένα για εμφάνιση.</p>
            )}
          </motion.section>
        )}

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-xl font-semibold text-sky-300">📈 Εξέλιξη 1RM</h2>
          <p className="text-gray-400">
            {logData.length === 0
              ? "Δεν υπάρχουν δεδομένα ακόμα."
              : `Τελευταίο PR: ${maxOneRM} kg`}
          </p>
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="text-xl font-semibold text-indigo-300">
            📅 Προγραμματισμός Κύκλου Προπόνησης
          </h2>
          <p className="text-white mt-2">📘 Τρέχων Τύπος Εβδομάδας: {userCycleMode}</p>
          <p className="text-white">📈 PR της εβδομάδας: {maxOneRM || "--"} kg</p>
          <p className="text-white">💓 Μέσο Recovery: {recoveryScore || "--"}/5</p>
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2 className="text-xl font-semibold text-emerald-300">🧪 Recovery Score</h2>
          <p className="text-white text-lg font-bold">{recoveryScore ?? "--"}</p>
        </motion.section>

        <motion.section
          className="bg-zinc-900/30 backdrop-blur-md shadow-md p-5 rounded-xl border border-neutral-700"
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <h2 className="text-xl font-semibold text-pink-300">🧠 AI Coach</h2>
          {coachAdvice ? (
            <p className="text-white mt-2">{coachAdvice}</p>
          ) : (
            <p className="text-gray-400">Δεν υπάρχουν συμβουλές ακόμη.</p>
          )}
        </motion.section>

        {notifications.length > 0 && (
          <div className="fixed top-2 right-2 space-y-2 z-50">
            {notifications.map((note) => (
              <div
                key={note.id}
                className="bg-yellow-200 border border-yellow-400 text-yellow-900 px-4 py-2 rounded shadow"
              >
                <div className="flex justify-between items-center">
                  <span>{note.text}</span>
                  <button
                    onClick={() => dismissNotification(note.id)}
                    className="ml-2 text-sm text-yellow-800"
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