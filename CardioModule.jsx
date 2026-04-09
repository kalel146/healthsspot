import React, { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";
import { useUser } from "@clerk/clerk-react";
import {
  Sparkles,
  HeartPulse,
  Flame,
  Ruler,
  LineChart as LineChartIcon,
  Bot,
  TrendingUp,
  Download,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import CardioInsights from "./CardioInsights";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const toIsoDate = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const toDisplayDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("el-GR");
};

const getWeekKey = (input) => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Άγνωστη εβδομάδα";

  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  const day = Math.floor(diff / 86400000);
  const week = Math.ceil((day + start.getDay() + 1) / 7);

  return `${date.getFullYear()}-W${week}`;
};

const safeNum = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeHistoryEntry = (entry = {}) => {
  const rawCreatedAt =
    entry.rawCreatedAt || entry.created_at || entry.date || new Date().toISOString();

  const rawVo2 = entry.VO2 ?? entry.vo2 ?? entry.value ?? null;
  const rawKcal = entry.kcal ?? null;

  return {
    rawCreatedAt,
    isoDate: toIsoDate(rawCreatedAt),
    date: toDisplayDate(rawCreatedAt),
    VO2:
      rawVo2 !== null && rawVo2 !== undefined && rawVo2 !== ""
        ? Number(rawVo2)
        : null,
    kcal:
      rawKcal !== null && rawKcal !== undefined && rawKcal !== ""
        ? Number(rawKcal)
        : null,
    activity: entry.activity || "Άλλο",
    type: entry.type || "",
    value:
      entry.value !== null && entry.value !== undefined && entry.value !== ""
        ? Number(entry.value)
        : null,
    testType: entry.testType || entry.test_type || "",
    distance: entry.distance !== undefined && entry.distance !== null ? Number(entry.distance) : null,
  };
};

const escapeCsv = (value) => {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export default function CardioModule({ cardioHistory = [] }) {
  const chartRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  const [mets, setMets] = useState(8);
  const [weight, setWeight] = useState(70);
  const [duration, setDuration] = useState(30);
  const [kcal, setKcal] = useState(null);

  const [activity, setActivity] = useState("Τρέξιμο");
  const [testType, setTestType] = useState("Cooper");
  const [distance, setDistance] = useState(2400);
  const [vo2max, setVo2max] = useState(null);

  const [history, setHistory] = useState([]);
  const [advice, setAdvice] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [expandedWeeks, setExpandedWeeks] = useState([]);

  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isSavingKcal, setIsSavingKcal] = useState(false);
  const [isSavingVo2, setIsSavingVo2] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const activities = ["Τρέξιμο", "Ποδήλατο", "Κολύμβηση", "HIIT", "Άλλο", "Όλα"];

  const normalizedPropHistory = useMemo(
    () => (Array.isArray(cardioHistory) ? cardioHistory.map(normalizeHistoryEntry) : []),
    [cardioHistory]
  );

  const effectiveHistory = history.length > 0 ? history : normalizedPropHistory;

  const toggleWeek = (week) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  const fetchHistory = useCallback(async () => {
    setIsFetchingHistory(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("cardio_logs")
      .select("created_at, vo2, kcal, activity, type, value, test_type, distance")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch cardio history failed:", error);
      setErrorMessage("Αποτυχία φόρτωσης cardio history.");
      setHistory([]);
      setIsFetchingHistory(false);
      return;
    }

    setHistory((data || []).map(normalizeHistoryEntry));
    setIsFetchingHistory(false);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const weeklyData = useMemo(() => {
    const grouped = {};

    effectiveHistory.forEach((entry) => {
      if (entry.type === "vo2max" && entry.VO2 !== null) {
        const week = getWeekKey(entry.rawCreatedAt);
        if (!grouped[week]) grouped[week] = [];
        grouped[week].push(entry);
      }
    });

    return Object.entries(grouped).map(([week, entries]) => {
      const vo2Values = entries.map((v) => v.VO2).filter((v) => v !== null);
      const max = Math.max(...vo2Values);
      const min = Math.min(...vo2Values);
      const avg = vo2Values.reduce((a, b) => a + b, 0) / vo2Values.length;
      const range = max - min;

      let feedback = "";
      let severity = "normal";

      if (range > 15 && avg < 40) {
        feedback = "⚠ Υψηλή διακύμανση και χαμηλό VO2max — πιθανή κόπωση ή κακή προσαρμογή.";
        severity = "high";
      } else if (range < 5 && avg < 35) {
        feedback = "📉 Σταθερά χαμηλό VO2max — ίσως θες αποκατάσταση ή αλλαγή stimulus.";
        severity = "medium";
      } else if (avg >= 50 && range <= 10) {
        feedback = "🏆 Σταθερά υψηλές επιδόσεις — πολύ καλή αερόβια εικόνα.";
        severity = "excellent";
      } else if (range > 10) {
        feedback = "⚠ Μεγάλη διακύμανση — σταθεροποίησε εντάσεις και recovery.";
        severity = "medium";
      } else {
        feedback = "✅ Καλή ισορροπία — το pattern σου δείχνει λογικό.";
        severity = "normal";
      }

      return {
        week,
        max,
        min,
        range,
        avg: avg.toFixed(1),
        feedback,
        severity,
        dates: entries.map((v) => v.isoDate),
        sessions: effectiveHistory.filter(
          (log) => getWeekKey(log.rawCreatedAt) === week && log.type !== "vo2max"
        ),
      };
    });
  }, [effectiveHistory]);

  const weeklyDelta = useMemo(() => {
    if (weeklyData.length < 2) return null;
    const last = weeklyData[weeklyData.length - 1];
    const prev = weeklyData[weeklyData.length - 2];

    return {
      deltaVO2: parseFloat(last.avg) - parseFloat(prev.avg),
      deltaRange: last.range - prev.range,
    };
  }, [weeklyData]);

  const filteredWeeklyData = useMemo(
    () =>
      weeklyData.filter((entry) => {
        const matchesWeek = selectedWeek ? entry.week === selectedWeek : true;
        const matchesDate = selectedDate ? entry.dates.includes(selectedDate) : true;
        return matchesWeek && matchesDate;
      }),
    [weeklyData, selectedWeek, selectedDate]
  );

  const filteredHistory = useMemo(
    () =>
      effectiveHistory.filter((entry) => {
        if (activity === "Όλα") return true;
        return entry.activity === activity;
      }),
    [effectiveHistory, activity]
  );

  const vo2HistoryOnly = useMemo(
    () => effectiveHistory.filter((entry) => entry.type === "vo2max" && entry.VO2 !== null),
    [effectiveHistory]
  );

  const vo2Extremes = useMemo(() => {
    if (!vo2HistoryOnly.length) return null;

    return vo2HistoryOnly.reduce(
      (acc, cur) => {
        if (!acc.peak || cur.VO2 > acc.peak.value) {
          acc.peak = { value: cur.VO2, date: cur.isoDate };
        }
        if (!acc.dip || cur.VO2 < acc.dip.value) {
          acc.dip = { value: cur.VO2, date: cur.isoDate };
        }
        return acc;
      },
      { peak: null, dip: null }
    );
  }, [vo2HistoryOnly]);

  const latestVo2 = vo2HistoryOnly.length ? vo2HistoryOnly[vo2HistoryOnly.length - 1].VO2 : null;
  const averageVo2 = vo2HistoryOnly.length
    ? (
        vo2HistoryOnly.reduce((acc, item) => acc + item.VO2, 0) / vo2HistoryOnly.length
      ).toFixed(1)
    : null;

  const totalKcal = effectiveHistory.length
    ? effectiveHistory.reduce((acc, item) => acc + safeNum(item.kcal, 0), 0).toFixed(0)
    : null;

  const regressionForecast = useMemo(() => {
    if (filteredWeeklyData.length < 3) return [];

    const x = filteredWeeklyData.map((_, i) => i);
    const y = filteredWeeklyData.map((entry) => parseFloat(entry.avg));
    const n = x.length;

    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;

    const numerator = x.reduce((acc, xi, i) => acc + (xi - xMean) * (y[i] - yMean), 0);
    const denominator = x.reduce((acc, xi) => acc + Math.pow(xi - xMean, 2), 0);
    if (!denominator) return [];

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    return filteredWeeklyData.map((entry, i) => ({
      week: entry.week,
      forecast: slope * i + intercept,
    }));
  }, [filteredWeeklyData]);

  const aiForecast = useMemo(() => {
    if (weeklyData.length < 2) return null;

    const [prev, current] = weeklyData.slice(-2);
    const currentAvg = parseFloat(current.avg);
    const prevAvg = parseFloat(prev.avg);

    if (currentAvg < prevAvg && current.range > prev.range && currentAvg < 40) {
      return {
        message:
          "📉 Πτώση απόδοσης και αυξημένη διακύμανση — μείωσε λίγο το load και βάλε recovery bias.",
        plan: ["2x χαμηλής έντασης sessions", "1x active recovery / mobility"],
      };
    }

    if (currentAvg > prevAvg && current.range < prev.range) {
      return {
        message:
          "📈 Ανοδική τάση και σταθεροποίηση — μπορείς να δοκιμάσεις πιο απαιτητικά sessions.",
        plan: ["1x threshold run", "1x HIIT session"],
      };
    }

    return {
      message: "🔄 Σταθερή εικόνα — κράτα παρόμοια δομή και ξαναμέτρα την επόμενη εβδομάδα.",
      plan: ["2x steady-state cardio"],
    };
  }, [weeklyData]);

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "excellent":
        return "text-emerald-400";
      default:
        return theme === "dark" ? "text-zinc-200" : "text-zinc-800";
    }
  };

  useEffect(() => {
    const last3 = effectiveHistory.slice(-3).filter((d) => d.VO2);
    if (last3.length < 2) {
      setAdvice("⚠️ Δεν υπάρχουν αρκετά δεδομένα για αξιολόγηση προόδου.");
      return;
    }

    const trend = last3[last3.length - 1].VO2 - last3[0].VO2;
    let baseAdvice = "";

    if (trend > 1.5) {
      baseAdvice = "🚀 Η VO2max σου ανεβαίνει. Συνέχισε με συνέπεια και όχι με ενθουσιασμό της μιας μέρας.";
    } else if (trend < -1.5) {
      baseAdvice = "📉 Η VO2max έχει πέσει. Κοίτα ύπνο, recovery και συνολικό load πριν κατηγορήσεις το σώμα.";
    } else {
      baseAdvice = "📊 Η VO2max μένει σταθερή. Ίσως θες λίγο πιο στοχευμένο stimulus.";
    }

    const weekMap = {};
    effectiveHistory.forEach((entry) => {
      const week = getWeekKey(entry.rawCreatedAt || entry.date);
      if (!weekMap[week]) weekMap[week] = { vo2Sum: 0, kcalSum: 0, count: 0 };

      if (entry.VO2) weekMap[week].vo2Sum += entry.VO2;
      if (entry.kcal) weekMap[week].kcalSum += entry.kcal;
      weekMap[week].count += 1;
    });

    const sortedWeeks = Object.entries(weekMap)
      .map(([week, stats]) => ({
        week,
        avgVO2: stats.count ? stats.vo2Sum / stats.count : 0,
        totalKcal: stats.kcalSum,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    if (sortedWeeks.length >= 2) {
      const last = sortedWeeks[sortedWeeks.length - 1];
      const prev = sortedWeeks[sortedWeeks.length - 2];
      const deltaVO2 = last.avgVO2 - prev.avgVO2;
      const deltaKcal = last.totalKcal - prev.totalKcal;
      baseAdvice += `\n📈 Σύγκριση εβδομάδων → VO2max: ${deltaVO2.toFixed(1)}, kcal: ${deltaKcal.toFixed(0)}`;
    }

    setAdvice(baseAdvice);
  }, [effectiveHistory]);

  const calculateKcal = async () => {
    const metsValue = parseFloat(mets);
    const weightValue = parseFloat(weight);
    const durationValue = parseFloat(duration);

    if (
      Number.isNaN(metsValue) ||
      Number.isNaN(weightValue) ||
      Number.isNaN(durationValue) ||
      metsValue <= 0 ||
      weightValue <= 0 ||
      durationValue <= 0
    ) {
      setErrorMessage("Συμπλήρωσε σωστά METs, βάρος και διάρκεια.");
      setStatusMessage("");
      return;
    }

    setIsSavingKcal(true);
    setErrorMessage("");
    setStatusMessage("");

    const vo2 = metsValue * 3.5 * weightValue;
    const kcalPerMin = (vo2 * 5) / 1000;
    const total = kcalPerMin * durationValue;
    const result = { vo2: vo2.toFixed(1), total: total.toFixed(1) };
    setKcal(result);

    const payload = {
      type: "kcal",
      mets: metsValue,
      weight: weightValue,
      duration: durationValue,
      vo2: Number(result.vo2),
      kcal: Number(result.total),
      activity,
      created_at: new Date().toISOString(),
      user_id: user?.id || null,
    };

    const { error } = await supabase.from("cardio_logs").insert([payload]);

    if (error) {
      console.error("Save cardio kcal failed:", error);
      setErrorMessage("Αποτυχία αποθήκευσης kcal session.");
      setIsSavingKcal(false);
      return;
    }

    setStatusMessage(`✅ Αποθηκεύτηκε cardio session: ${result.total} kcal.`);
    setIsSavingKcal(false);
    fetchHistory();
  };

  const calculateVO2max = async () => {
    const distanceValue = parseFloat(distance);

    if (Number.isNaN(distanceValue) || distanceValue <= 0) {
      setErrorMessage("Συμπλήρωσε σωστή απόσταση.");
      setStatusMessage("");
      return;
    }

    setIsSavingVo2(true);
    setErrorMessage("");
    setStatusMessage("");

    let result = 0;
    if (testType === "Cooper") {
      result = (distanceValue - 504.9) / 44.73;
    }

    const fixed = Number(result.toFixed(1));
    setVo2max(fixed.toFixed(1));

    const { error } = await supabase.from("cardio_logs").insert([
      {
        type: "vo2max",
        test_type: testType,
        value: fixed,
        vo2: fixed,
        distance: distanceValue,
        activity,
        created_at: new Date().toISOString(),
        user_id: user?.id || null,
      },
    ]);

    if (error) {
      console.error("Save cardio VO2max failed:", error);
      setErrorMessage("Αποτυχία αποθήκευσης VO2max test.");
      setIsSavingVo2(false);
      return;
    }

    setStatusMessage(`✅ Αποθηκεύτηκε VO2max test: ${fixed.toFixed(1)} mL/kg/min.`);
    setIsSavingVo2(false);
    fetchHistory();
  };

  const exportToExcel = async () => {
    if (isExportingExcel) return;

    try {
      setIsExportingExcel(true);
      const XLSX = await import("xlsx");

      const dataToExport = filteredWeeklyData.map(({ week, max, min, range, avg, feedback }) => ({
        Εβδομάδα: week,
        Μέγιστο: max,
        Ελάχιστο: min,
        Εύρος: range,
        ΜέσοςΌρος: avg,
        Feedback: feedback,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "VO2 Insights");
      XLSX.writeFile(workbook, "VO2max_Weekly_Insights.xlsx");
    } catch (error) {
      console.error("Excel export failed:", error);
      setErrorMessage("Αποτυχία εξαγωγής Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (isExportingPdf) return;
    const element = chartRef.current;
    if (!element) return;

    try {
      setIsExportingPdf(true);

      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const canvas = await html2canvas(element, { backgroundColor: theme === "dark" ? "#000000" : "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let imgWidth = pageWidth - 10;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight - 10) {
        const ratio = (pageHeight - 10) / imgHeight;
        imgWidth *= ratio;
        imgHeight *= ratio;
      }

      pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);
      pdf.save("cardio_report.pdf");
    } catch (error) {
      console.error("Cardio PDF export failed:", error);
      setErrorMessage("Αποτυχία εξαγωγής PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExportingCsv) return;

    try {
      setIsExportingCsv(true);

      const rows = [["Ημερομηνία", "VO2max", "kcal", "Activity", "Type"]];
      filteredHistory.forEach((entry) => {
        rows.push([
          entry.date,
          entry.VO2 ?? "",
          entry.kcal ?? "",
          entry.activity ?? "",
          entry.type ?? "",
        ]);
      });

      const csvContent = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "cardio_report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV export failed:", error);
      setErrorMessage("Αποτυχία εξαγωγής CSV.");
    } finally {
      setIsExportingCsv(false);
    }
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

  return (
    <motion.div
      className={`min-h-screen px-4 py-8 md:px-6 xl:px-8 ${
        theme === "dark" ? "bg-black text-white" : "bg-zinc-50 text-black"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Helmet>
        <title>Cardio Module | Health's Spot</title>
        <meta
          name="description"
          content="Υπολόγισε METs, VO2max και θερμίδες στο Cardio Lab του Health’s Spot."
        />
        <meta name="keywords" content="cardio, vo2max, calories, fitness, METs" />
        <html lang="el" />
      </Helmet>

      <div className="mx-auto w-full max-w-7xl space-y-6">
        {!user?.id && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            theme === "dark"
              ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
              : "border-yellow-200 bg-yellow-50 text-yellow-800"
          }`}>
            Δεν έχεις συνδεθεί — το module λειτουργεί, αλλά το cloud logging θέλει login.
          </div>
        )}

        {(statusMessage || errorMessage) && (
          <div className="space-y-2">
            {statusMessage && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${
                theme === "dark"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}>
                {statusMessage}
              </div>
            )}

            {errorMessage && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${
                theme === "dark"
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-300"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}>
                {errorMessage}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-yellow-400 md:text-4xl">
              <HeartPulse className="h-7 w-7 animate-pulse" />
              Cardio Lab
            </h1>
            <p className={`mt-1 text-sm md:text-base ${mutedTextClass}`}>
              VO2max, kcal estimation, weekly insight layer και λιγότερο στενό κουτί με κρίση ταυτότητας.
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
              onClick={fetchHistory}
              disabled={isFetchingHistory}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingHistory ? "animate-spin" : ""}`} />
              {isFetchingHistory ? "Refreshing..." : "Refresh"}
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExportingCsv}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingCsv ? "Exporting CSV..." : "Export CSV"}
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Τελευταίο VO2max</p>
            <p className="mt-2 text-2xl font-bold text-blue-400">
              {latestVo2 ? `${latestVo2.toFixed(1)}` : "--"}
            </p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Μέσο VO2max</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{averageVo2 || "--"}</p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Συνολικά kcal</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">{totalKcal || "--"}</p>
          </div>

          <div className={statCardClass}>
            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>Sessions</p>
            <p className="mt-2 text-2xl font-bold text-pink-400">{effectiveHistory.length}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-green-400">
                  <Flame className="h-5 w-5" />
                  Υπολογισμός kcal (MET → VO2 → kcal)
                </h2>
                <p className={`text-sm ${mutedTextClass}`}>
                  Βασικός estimator, καθαρά παρουσιασμένος, χωρίς λευκά κουτιά που ουρλιάζουν.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="mets" className={labelClass}>METs</label>
                  <input id="mets" type="number" value={mets} onChange={(e) => setMets(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="weight" className={labelClass}>Βάρος (kg)</label>
                  <input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="duration" className={labelClass}>Διάρκεια (λεπτά)</label>
                  <input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={calculateKcal}
                  disabled={isSavingKcal}
                  className="rounded-xl bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingKcal ? "Saving..." : "Υπολόγισε kcal"}
                </button>

                {kcal && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                    VO2: <strong>{kcal.vo2}</strong> | kcal: <strong>{kcal.total}</strong>
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-blue-400">
                  <Ruler className="h-5 w-5" />
                  VO2max Test
                </h2>
                <p className={`text-sm ${mutedTextClass}`}>
                  Cooper test με activity tagging για πιο καθαρό logging.
                </p>
              </div>

              <div className="mb-4 space-y-2">
                <span className={labelClass}>Τύπος Δραστηριότητας</span>
                <div className="flex flex-wrap gap-2">
                  {activities.filter((act) => act !== "Όλα").map((act) => (
                    <button
                      key={act}
                      onClick={() => setActivity(act)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium ${
                        activity === act
                          ? "border-yellow-500 bg-yellow-400 text-black"
                          : theme === "dark"
                          ? "border-zinc-700 bg-zinc-800 text-white"
                          : "border-zinc-300 bg-zinc-100 text-black"
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="vo2test" className={labelClass}>Επιλογή Τεστ</label>
                  <select id="vo2test" value={testType} onChange={(e) => setTestType(e.target.value)} className={inputClass}>
                    <option value="Cooper">Cooper Test</option>
                    <option value="Rockport" disabled>Rockport (υπό ανάπτυξη)</option>
                    <option value="Step" disabled>Step Test (υπό ανάπτυξη)</option>
                  </select>
                </div>

                {testType === "Cooper" && (
                  <div>
                    <label htmlFor="cooper-distance" className={labelClass}>Απόσταση σε μέτρα (12 λεπτά)</label>
                    <input
                      id="cooper-distance"
                      type="number"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="π.χ. 2400"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={calculateVO2max}
                  disabled={isSavingVo2}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingVo2 ? "Saving..." : "Υπολόγισε VO2max"}
                </button>

                {vo2max && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                    VO2max: <strong>{vo2max}</strong> mL/kg/min
                  </div>
                )}
              </div>
            </motion.section>

            <motion.section ref={chartRef} className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-yellow-400">
                    <LineChartIcon className="h-5 w-5" />
                    Ιστορικό VO2max και kcal
                  </h2>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Full-width chart panel αντί για στενό κουτί με κρίση ταυτότητας.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activities.map((act) => (
                    <button
                      key={act}
                      onClick={() => setActivity(act)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                        activity === act
                          ? "border-yellow-600 bg-yellow-400 text-black"
                          : theme === "dark"
                          ? "border-zinc-700 bg-zinc-800 text-white"
                          : "border-zinc-300 bg-zinc-100 text-black"
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              {isFetchingHistory ? (
                <div className={`py-12 text-center text-sm ${mutedTextClass}`}>Φόρτωση cardio history...</div>
              ) : filteredHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <RechartsLineChart data={filteredHistory} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="VO2" stroke="#3b82f6" name="VO2max" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="kcal" stroke="#10b981" name="kcal" strokeWidth={2.5} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <div className={`py-12 text-center text-sm ${mutedTextClass}`}>
                  Δεν υπάρχουν ακόμη δεδομένα για το επιλεγμένο φίλτρο δραστηριότητας.
                </div>
              )}

              {advice && (
                <motion.div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="flex items-center gap-2 text-sm font-medium text-yellow-300">
                    <Bot className="h-4 w-4" />
                    {advice.split("\n")[0]}
                  </p>
                </motion.div>
              )}

              {advice.includes("Σύγκριση εβδομάδων") && (
                <motion.div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/10 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="flex items-center gap-2 text-sm font-medium text-purple-300">
                    <LineChartIcon className="h-4 w-4" />
                    {advice.split("\n")[1]}
                  </p>
                </motion.div>
              )}
            </motion.section>
          </div>

          <div className="space-y-6 xl:col-span-5">
            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-purple-400">🗓 Ημερολογιακή Επισκόπηση</h3>
                <p className={`text-sm ${mutedTextClass}`}>Χρωματική ένδειξη severity ανά εβδομάδα.</p>
              </div>

              <div className="flex justify-center">
                <Calendar
                  onChange={(date) => {
                    const iso = toIsoDate(date);
                    setCalendarDate(date);
                    setSelectedDate(iso);
                  }}
                  value={calendarDate}
                  tileClassName={({ date }) => {
                    const iso = toIsoDate(date);
                    const entry = weeklyData.find((week) => week.dates.includes(iso));

                    if (entry) {
                      switch (entry.severity) {
                        case "high":
                          return "bg-red-200";
                        case "medium":
                          return "bg-yellow-200";
                        case "excellent":
                          return "bg-green-200";
                        default:
                          return "bg-blue-100";
                      }
                    }
                    return null;
                  }}
                  className="rounded-lg border border-zinc-300 shadow"
                />
              </div>
            </motion.section>

            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <h3 className="text-lg font-semibold text-indigo-400">🎛 Φίλτρα & Exports</h3>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Επιλογή Εβδομάδας</label>
                  <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className={inputClass}>
                    <option value="">Όλες</option>
                    {weeklyData.map((w) => (
                      <option key={w.week} value={w.week}>{w.week}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Επιλογή Ημερομηνίας</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={exportToExcel}
                  disabled={isExportingExcel}
                  className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {isExportingExcel ? "Exporting..." : "Export XLSX"}
                </button>

                <button
                  onClick={() => {
                    setSelectedWeek("");
                    setSelectedDate("");
                    setCalendarDate(new Date());
                  }}
                  className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Reset Filters
                </button>
              </div>
            </motion.section>

            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <h3 className="text-lg font-semibold text-blue-400">📈 Weekly Delta</h3>

              {weeklyDelta ? (
                <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-blue-300">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <TrendingUp className="h-4 w-4" />
                    Εβδομαδιαία μεταβολή — VO2max: {weeklyDelta.deltaVO2.toFixed(1)} | Εύρος: {weeklyDelta.deltaRange.toFixed(1)}
                  </div>
                </div>
              ) : (
                <p className={`mt-3 text-sm ${mutedTextClass}`}>Δεν υπάρχουν αρκετά δεδομένα ακόμα.</p>
              )}

              {aiForecast && (
                <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                  <h4 className="text-sm font-semibold text-indigo-300">🔮 AI Forecast</h4>
                  <p className="mt-2 text-sm text-indigo-200">{aiForecast.message}</p>
                  <ul className="mt-3 ml-5 list-disc space-y-1 text-sm text-indigo-200">
                    {aiForecast.plan.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.section>

            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-400">
                <Sparkles className="h-5 w-5" />
                Συνοπτικά Insights
              </h3>

              <ul className="mt-4 ml-5 list-disc space-y-2 text-sm">
                <li>📈 Συνολικός μέσος VO2max: {averageVo2 || "-"}</li>
                <li>
                  🔍 Πιο σταθερή εβδομάδα:{" "}
                  {weeklyData.length > 0
                    ? weeklyData.reduce((acc, w) => (w.range < acc.range ? w : acc), weeklyData[0]).week
                    : "-"}
                </li>
                <li>
                  ⚠ Εντονότερη πτώση:{" "}
                  {vo2Extremes?.dip ? `${vo2Extremes.dip.value.toFixed(1)} mL/kg/min (${vo2Extremes.dip.date})` : "-"}
                </li>
                <li>
                  🏔 Peak VO2max:{" "}
                  {vo2Extremes?.peak ? `${vo2Extremes.peak.value.toFixed(1)} mL/kg/min (${vo2Extremes.peak.date})` : "-"}
                </li>
              </ul>
            </motion.section>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <h2 className="text-lg font-semibold text-indigo-400">📉 Διακύμανση VO2max</h2>

              {vo2Extremes?.peak && vo2Extremes?.dip ? (
                <ul className="mt-4 ml-5 list-disc space-y-2 text-sm">
                  <li>📈 Peak επίδοση: {vo2Extremes.peak.value.toFixed(1)} mL/kg/min ({vo2Extremes.peak.date})</li>
                  <li>📉 Χαμηλότερη τιμή: {vo2Extremes.dip.value.toFixed(1)} mL/kg/min ({vo2Extremes.dip.date})</li>
                  <li>
                    💡 Συμβουλή:{" "}
                    {vo2Extremes.peak.value - vo2Extremes.dip.value > 10
                      ? "Η διακύμανση είναι μεγάλη — σταθεροποίησε την ένταση."
                      : "Καλή σταθερότητα στην απόδοσή σου — συνέχισε έτσι."}
                  </li>
                </ul>
              ) : (
                <p className={`mt-3 text-sm ${mutedTextClass}`}>Δεν υπάρχουν επαρκή δεδομένα για διακύμανση VO2max.</p>
              )}
            </motion.section>

            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              <h2 className="text-lg font-semibold text-blue-400">📈 Προβλεπόμενη Τάση VO2max</h2>

              {filteredWeeklyData.length > 0 && regressionForecast.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart
                    data={filteredWeeklyData.map((entry, i) => ({
                      ...entry,
                      avg: Number(entry.avg),
                      forecast: regressionForecast[i]?.forecast || null,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg" stroke="#10b981" name="Μέσος Όρος" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="forecast" stroke="#6366f1" strokeDasharray="5 5" name="Πρόβλεψη" strokeWidth={2.5} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              ) : (
                <p className={`mt-3 text-sm ${mutedTextClass}`}>Δεν υπάρχουν αρκετά δεδομένα για πρόβλεψη.</p>
              )}
            </motion.section>

            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <h2 className="text-lg font-semibold text-cyan-400">📊 Εβδομαδιαία Στατιστικά VO2max</h2>

              {weeklyData.length > 0 ? (
                <ul className="mt-4 ml-5 list-disc space-y-2 text-sm">
                  {weeklyData.map((entry) => (
                    <li key={entry.week} className={getSeverityClass(entry.severity)}>
                      <strong>{entry.week}:</strong> Μέγιστο: {entry.max} mL/kg/min, Ελάχιστο: {entry.min} mL/kg/min, Μέσος Όρος: {entry.avg} mL/kg/min
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-3 text-sm ${mutedTextClass}`}>Δεν υπάρχουν εβδομαδιαία δεδομένα ακόμα.</p>
              )}
            </motion.section>
          </div>

          <div className="space-y-6 xl:col-span-5">
            {filteredWeeklyData.length > 0 && (
              <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}>
                <h3 className="text-lg font-semibold text-purple-400">🤖 Εβδομαδιαία AI Ανάλυση</h3>

                <ul className="mt-4 space-y-2 text-sm">
                  {filteredWeeklyData.map((entry) => (
                    <li key={entry.week} className="overflow-hidden rounded-xl border border-zinc-700">
                      <button
                        onClick={() => toggleWeek(entry.week)}
                        className={`flex w-full items-center justify-between px-4 py-3 text-left font-semibold ${getSeverityClass(entry.severity)}`}
                      >
                        <span>{entry.week}</span>
                        {expandedWeeks.includes(entry.week) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>

                      {expandedWeeks.includes(entry.week) && (
                        <div className="space-y-2 px-4 pb-4">
                          <p>{entry.feedback}</p>
                          <ul className="ml-5 list-disc text-xs">
                            {entry.sessions.map((s, i) => (
                              <li key={`${entry.week}-${i}`}>
                                {toIsoDate(s.rawCreatedAt)} — {s.type} — {s.value ?? s.kcal ?? "-"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}

            <motion.section className={panelClass} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <h3 className="text-lg font-semibold text-sky-400">🔬 Cardio Insights Layer</h3>
              <div className="mt-4">
                <CardioInsights history={effectiveHistory} activity={activity} />
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
