import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser } from "@clerk/clerk-react";
import {
  Download,
  Filter,
  HeartPulse,
  Salad,
  ShieldPlus,
  Swords,
  FileText,
} from "lucide-react";
import { useTheme } from "./ThemeContext";
import { supabase } from "./supabaseClient";

const defaultSelected = {
  strength: true,
  cardio: true,
  nutrition: true,
  recovery: true,
};

const moduleMeta = {
  strength: {
    label: "Strength",
    icon: Swords,
    accent: "text-fuchsia-400",
  },
  cardio: {
    label: "Cardio",
    icon: HeartPulse,
    accent: "text-rose-400",
  },
  nutrition: {
    label: "Nutrition",
    icon: Salad,
    accent: "text-emerald-400",
  },
  recovery: {
    label: "Recovery",
    icon: ShieldPlus,
    accent: "text-cyan-400",
  },
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNumber = (value, digits = 1) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(digits) : "-";
};

const parseDate = (value) => {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const greekDateMatch = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (greekDateMatch) {
    const [, d, m, y] = greekDateMatch;
    const parsed = new Date(
      `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00`
    );
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return "-";

  return date.toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const toCsvValue = (value) => {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const getRangeStart = (rangeKey) => {
  if (rangeKey === "all") return null;

  const now = new Date();
  const start = new Date(now);

  if (rangeKey === "7d") start.setDate(now.getDate() - 7);
  if (rangeKey === "30d") start.setDate(now.getDate() - 30);
  if (rangeKey === "90d") start.setDate(now.getDate() - 90);

  return start;
};

const isInRange = (value, rangeKey) => {
  const date = parseDate(value);
  if (!date) return false;

  const rangeStart = getRangeStart(rangeKey);
  if (!rangeStart) return true;

  return date >= rangeStart;
};

export default function ExportModule() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  const [selected, setSelected] = useState(defaultSelected);
  const [dateRange, setDateRange] = useState("30d");
  const [datasets, setDatasets] = useState({
    strengthLogs: [],
    cardioLogs: [],
    intakeLogs: [],
    latestMealPlan: null,
    metrics: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const isDark = theme === "dark";

  const pageClass = isDark ? "bg-black text-white" : "bg-zinc-50 text-black";

  const panelClass = isDark
    ? "rounded-2xl border border-white/10 bg-zinc-900/80 shadow-xl shadow-black/20"
    : "rounded-2xl border border-black/5 bg-white shadow-lg shadow-black/5";

  const subtlePanelClass = isDark
    ? "rounded-2xl border border-white/10 bg-white/5"
    : "rounded-2xl border border-black/5 bg-zinc-50";

  const mutedTextClass = isDark ? "text-zinc-400" : "text-zinc-500";

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const strengthPromise = supabase
        .from("strength_logs")
        .select(
          "id, type, exercise, weight, reps, sets, rpe, notes, maxOneRM, recoveryScore, sleep, energy, pain, mood, stress, date, timestamp"
        )
        .order("timestamp", { ascending: false });

      const cardioPromise = supabase
        .from("cardio_logs")
        .select(
          "id, created_at, vo2, kcal, activity, type, value, test_type, distance, mets, weight, duration"
        )
        .order("created_at", { ascending: false });

      const intakePromise = user
        ? supabase
            .from("intake_logs")
            .select("date, kcal, protein, carbs, fat")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const mealPlanPromise = user
        ? supabase
            .from("meal_plans")
            .select("created_at, plan_data")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null });

      const metricsPromise = user
        ? supabase
            .from("metrics")
            .select("*")
            .eq("user_id", user.id)
            .order("week", { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const [strengthRes, cardioRes, intakeRes, mealPlanRes, metricsRes] =
        await Promise.all([
          strengthPromise,
          cardioPromise,
          intakePromise,
          mealPlanPromise,
          metricsPromise,
        ]);

      const errors = [
        strengthRes.error,
        cardioRes.error,
        intakeRes.error,
        mealPlanRes.error,
        metricsRes.error,
      ].filter(Boolean);

      if (errors.length) {
        throw errors[0];
      }

      setDatasets({
        strengthLogs: strengthRes.data || [],
        cardioLogs: cardioRes.data || [],
        intakeLogs: intakeRes.data || [],
        latestMealPlan: mealPlanRes.data || null,
        metrics: metricsRes.data || [],
      });
    } catch (error) {
      console.error("Export module fetch failed:", error);
      setErrorMessage(
        "Αποτυχία φόρτωσης export data. Κάποιο table κάνει τον δύσκολο."
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredStrengthLogs = useMemo(() => {
    return (datasets.strengthLogs || []).filter((entry) => {
      const stamp = entry?.timestamp || entry?.date;
      return entry?.type !== "Recovery" && isInRange(stamp, dateRange);
    });
  }, [datasets.strengthLogs, dateRange]);

  const filteredRecoveryLogs = useMemo(() => {
    return (datasets.strengthLogs || []).filter((entry) => {
      const stamp = entry?.timestamp || entry?.date;
      return entry?.type === "Recovery" && isInRange(stamp, dateRange);
    });
  }, [datasets.strengthLogs, dateRange]);

  const filteredCardioLogs = useMemo(() => {
    return (datasets.cardioLogs || []).filter((entry) =>
      isInRange(entry?.created_at, dateRange)
    );
  }, [datasets.cardioLogs, dateRange]);

  const filteredIntakeLogs = useMemo(() => {
    return (datasets.intakeLogs || []).filter((entry) =>
      isInRange(entry?.date, dateRange)
    );
  }, [datasets.intakeLogs, dateRange]);

  const latestMealPlanSummary = useMemo(() => {
    const rawPlan = datasets.latestMealPlan?.plan_data || {};
    const entries = Object.entries(rawPlan || {});
    const filledEntries = entries.filter(([, value]) => Boolean(value));

    return {
      createdAt: datasets.latestMealPlan?.created_at || null,
      totalSlots: entries.length,
      filledSlots: filledEntries.length,
      sampleMeals: filledEntries.slice(0, 6).map(([slot, meal]) => ({
        slot,
        meal,
      })),
    };
  }, [datasets.latestMealPlan]);

  const latestMetrics = useMemo(
    () => (datasets.metrics || [])[0] || null,
    [datasets.metrics]
  );

  const strengthSummary = useMemo(() => {
    const best1RM = filteredStrengthLogs.reduce(
      (max, entry) => Math.max(max, safeNumber(entry?.maxOneRM, 0)),
      0
    );

    const uniqueExercises = new Set(
      filteredStrengthLogs.map((entry) => entry?.exercise).filter(Boolean)
    ).size;

    const latest = filteredStrengthLogs[0] || null;

    return {
      count: filteredStrengthLogs.length,
      best1RM: best1RM > 0 ? Number(best1RM.toFixed(1)) : null,
      latest1RM: latest ? safeNumber(latest?.maxOneRM, 0) : null,
      uniqueExercises,
    };
  }, [filteredStrengthLogs]);

  const cardioSummary = useMemo(() => {
    const vo2Entries = filteredCardioLogs.filter((entry) => {
      const value = entry?.vo2 ?? entry?.value;
      return value !== null && value !== undefined && value !== "";
    });

    const vo2Average = vo2Entries.length
      ? vo2Entries.reduce(
          (sum, entry) => sum + safeNumber(entry?.vo2 ?? entry?.value, 0),
          0
        ) / vo2Entries.length
      : null;

    const kcalTotal = filteredCardioLogs.reduce(
      (sum, entry) => sum + safeNumber(entry?.kcal, 0),
      0
    );

    const latest = filteredCardioLogs[0] || null;

    return {
      count: filteredCardioLogs.length,
      avgVo2: vo2Average ? Number(vo2Average.toFixed(1)) : null,
      kcalTotal: Number(kcalTotal.toFixed(1)),
      latestActivity: latest?.activity || null,
    };
  }, [filteredCardioLogs]);

  const nutritionSummary = useMemo(() => {
    const avgKcal = filteredIntakeLogs.length
      ? filteredIntakeLogs.reduce(
          (sum, entry) => sum + safeNumber(entry?.kcal, 0),
          0
        ) / filteredIntakeLogs.length
      : null;

    const latest = filteredIntakeLogs[0] || null;

    return {
      count: filteredIntakeLogs.length,
      avgKcal: avgKcal ? Number(avgKcal.toFixed(1)) : null,
      latestKcal: latest ? safeNumber(latest?.kcal, 0) : null,
      latestProtein: latest ? safeNumber(latest?.protein, 0) : null,
      latestCarbs: latest ? safeNumber(latest?.carbs, 0) : null,
      latestFat: latest ? safeNumber(latest?.fat, 0) : null,
      planFilledSlots: latestMealPlanSummary.filledSlots,
    };
  }, [filteredIntakeLogs, latestMealPlanSummary]);

  const recoverySummary = useMemo(() => {
    const avgRecovery = filteredRecoveryLogs.length
      ? filteredRecoveryLogs.reduce(
          (sum, entry) => sum + safeNumber(entry?.recoveryScore, 0),
          0
        ) / filteredRecoveryLogs.length
      : null;

    const avgStress = filteredRecoveryLogs.length
      ? filteredRecoveryLogs.reduce(
          (sum, entry) => sum + safeNumber(entry?.stress, 0),
          0
        ) / filteredRecoveryLogs.length
      : null;

    const latest = filteredRecoveryLogs[0] || null;

    return {
      count: filteredRecoveryLogs.length,
      avgRecovery: avgRecovery ? Number(avgRecovery.toFixed(1)) : null,
      avgStress: avgStress ? Number(avgStress.toFixed(1)) : null,
      latestRecovery: latest ? safeNumber(latest?.recoveryScore, 0) : null,
    };
  }, [filteredRecoveryLogs]);

  const previewSections = useMemo(() => {
    const sections = [];

    if (selected.strength) {
      sections.push({
        key: "strength",
        title: "Strength Overview",
        summary: [
          `Sessions: ${strengthSummary.count}`,
          `Best 1RM: ${
            strengthSummary.best1RM ? `${strengthSummary.best1RM} kg` : "-"
          }`,
          `Exercises: ${strengthSummary.uniqueExercises}`,
        ],
        rows: filteredStrengthLogs.slice(0, 6).map((entry) => ({
          date: formatDate(entry?.timestamp || entry?.date),
          main: entry?.exercise || entry?.type || "Strength entry",
          detail: `${
            safeNumber(entry?.weight, 0) || "-"
          } kg • ${safeNumber(entry?.reps, 0) || "-"} reps • 1RM ${formatNumber(
            entry?.maxOneRM,
            1
          )} kg`,
        })),
      });
    }

    if (selected.cardio) {
      sections.push({
        key: "cardio",
        title: "Cardio Overview",
        summary: [
          `Entries: ${cardioSummary.count}`,
          `Avg VO₂: ${cardioSummary.avgVo2 ? `${cardioSummary.avgVo2}` : "-"}`,
          `Kcal total: ${formatNumber(cardioSummary.kcalTotal, 1)}`,
        ],
        rows: filteredCardioLogs.slice(0, 6).map((entry) => ({
          date: formatDate(entry?.created_at),
          main: entry?.activity || entry?.type || "Cardio entry",
          detail: `VO₂ ${formatNumber(
            entry?.vo2 ?? entry?.value,
            1
          )} • kcal ${formatNumber(entry?.kcal, 1)} • ${
            entry?.test_type || entry?.type || "session"
          }`,
        })),
      });
    }

    if (selected.nutrition) {
      sections.push({
        key: "nutrition",
        title: "Nutrition Overview",
        summary: [
          `Intake logs: ${nutritionSummary.count}`,
          `Avg kcal: ${
            nutritionSummary.avgKcal ? `${nutritionSummary.avgKcal}` : "-"
          }`,
          `Filled plan slots: ${nutritionSummary.planFilledSlots}`,
        ],
        rows: filteredIntakeLogs.slice(0, 6).map((entry) => ({
          date: formatDate(entry?.date),
          main: `${safeNumber(entry?.kcal, 0)} kcal`,
          detail: `P ${formatNumber(entry?.protein, 1)}g • C ${formatNumber(
            entry?.carbs,
            1
          )}g • F ${formatNumber(entry?.fat, 1)}g`,
        })),
      });
    }

    if (selected.recovery) {
      sections.push({
        key: "recovery",
        title: "Recovery Overview",
        summary: [
          `Check-ins: ${recoverySummary.count}`,
          `Avg recovery: ${
            recoverySummary.avgRecovery
              ? `${recoverySummary.avgRecovery}/5`
              : "-"
          }`,
          `Avg stress: ${
            recoverySummary.avgStress ? `${recoverySummary.avgStress}/5` : "-"
          }`,
        ],
        rows: filteredRecoveryLogs.slice(0, 6).map((entry) => ({
          date: formatDate(entry?.timestamp || entry?.date),
          main: `${formatNumber(entry?.recoveryScore, 1)}/5 recovery`,
          detail: `Sleep ${entry?.sleep ?? "-"} • Energy ${
            entry?.energy ?? "-"
          } • Mood ${entry?.mood ?? "-"} • Pain ${entry?.pain ?? "-"} • Stress ${
            entry?.stress ?? "-"
          }`,
        })),
      });
    }

    return sections;
  }, [
    selected,
    strengthSummary,
    cardioSummary,
    nutritionSummary,
    recoverySummary,
    filteredStrengthLogs,
    filteredCardioLogs,
    filteredIntakeLogs,
    filteredRecoveryLogs,
  ]);

  const buildCsvSections = () => {
    const sections = [];

    if (selected.strength) {
      sections.push([
        ["Strength Logs"],
        ["Date", "Exercise", "Weight", "Reps", "Sets", "RPE", "1RM", "Notes"],
        ...filteredStrengthLogs.map((entry) => [
          formatDate(entry?.timestamp || entry?.date),
          entry?.exercise || entry?.type || "",
          entry?.weight ?? "",
          entry?.reps ?? "",
          entry?.sets ?? "",
          entry?.rpe ?? "",
          entry?.maxOneRM ?? "",
          entry?.notes || "",
        ]),
      ]);
    }

    if (selected.cardio) {
      sections.push([
        ["Cardio Logs"],
        ["Date", "Activity", "Type", "VO2", "Kcal", "Distance", "METs", "Duration"],
        ...filteredCardioLogs.map((entry) => [
          formatDate(entry?.created_at),
          entry?.activity || "",
          entry?.test_type || entry?.type || "",
          entry?.vo2 ?? entry?.value ?? "",
          entry?.kcal ?? "",
          entry?.distance ?? "",
          entry?.mets ?? "",
          entry?.duration ?? "",
        ]),
      ]);
    }

    if (selected.nutrition) {
      sections.push([
        ["Nutrition Intake Logs"],
        ["Date", "Kcal", "Protein", "Carbs", "Fat"],
        ...filteredIntakeLogs.map((entry) => [
          formatDate(entry?.date),
          entry?.kcal ?? "",
          entry?.protein ?? "",
          entry?.carbs ?? "",
          entry?.fat ?? "",
        ]),
      ]);

      if (latestMealPlanSummary.filledSlots > 0) {
        sections.push([
          ["Latest Meal Plan Snapshot"],
          ["Slot", "Meal"],
          ...latestMealPlanSummary.sampleMeals.map((item) => [item.slot, item.meal]),
        ]);
      }
    }

    if (selected.recovery) {
      sections.push([
        ["Recovery Logs"],
        ["Date", "Recovery Score", "Sleep", "Energy", "Mood", "Pain", "Stress"],
        ...filteredRecoveryLogs.map((entry) => [
          formatDate(entry?.timestamp || entry?.date),
          entry?.recoveryScore ?? "",
          entry?.sleep ?? "",
          entry?.energy ?? "",
          entry?.mood ?? "",
          entry?.pain ?? "",
          entry?.stress ?? "",
        ]),
      ]);
    }

    return sections;
  };

  const handleCsvExport = async () => {
    if (isExportingCsv) return;

    try {
      setIsExportingCsv(true);
      setStatusMessage("");
      setErrorMessage("");

      const sections = buildCsvSections();

      if (!sections.length) {
        setStatusMessage("Δεν υπάρχει επιλεγμένο περιεχόμενο για CSV export.");
        return;
      }

      const csvBlocks = sections.map((section) =>
        section.map((row) => row.map(toCsvValue).join(",")).join("\n")
      );

      const blob = new Blob([csvBlocks.join("\n\n")], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `healths-spot-report-${dateRange}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage("✅ Το CSV export ολοκληρώθηκε.");
    } catch (error) {
      console.error("CSV export failed:", error);
      setErrorMessage("Αποτυχία εξαγωγής CSV.");
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handlePdfExport = async () => {
    if (isExportingPdf) return;

    try {
      setIsExportingPdf(true);
      setStatusMessage("");
      setErrorMessage("");

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 18;

      doc.setFontSize(18);
      doc.text("Health's Spot - Export Report", 14, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.text(
        `Date range: ${dateRange.toUpperCase()} • Exported: ${new Date().toLocaleDateString(
          "el-GR"
        )}`,
        14,
        currentY
      );
      currentY += 8;

      if (latestMetrics) {
        doc.setFontSize(11);
        doc.text(
          `Latest dashboard metrics: BMR ${latestMetrics.bmr ?? "-"} • VO2max ${
            latestMetrics.vo2max ?? "-"
          } • Protein ${latestMetrics.protein ?? "-"} • Carbs ${
            latestMetrics.carbs ?? "-"
          } • Fat ${latestMetrics.fat ?? "-"}`,
          14,
          currentY,
          { maxWidth: pageWidth - 28 }
        );
        currentY += 10;
      }

      const renderSectionTitle = (title) => {
        doc.setFontSize(14);
        doc.text(title, 14, currentY);
        currentY += 4;
      };

      if (selected.strength) {
        renderSectionTitle("Strength");
        autoTable(doc, {
          startY: currentY,
          head: [["Date", "Exercise", "Weight", "Reps", "Sets", "RPE", "1RM"]],
          body: filteredStrengthLogs.map((entry) => [
            formatDate(entry?.timestamp || entry?.date),
            entry?.exercise || entry?.type || "",
            entry?.weight ?? "",
            entry?.reps ?? "",
            entry?.sets ?? "",
            entry?.rpe ?? "",
            entry?.maxOneRM ?? "",
          ]),
          styles: { fontSize: 9 },
          theme: "grid",
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }

      if (selected.cardio) {
        renderSectionTitle("Cardio");
        autoTable(doc, {
          startY: currentY,
          head: [["Date", "Activity", "Type", "VO2", "Kcal", "Distance", "METs", "Duration"]],
          body: filteredCardioLogs.map((entry) => [
            formatDate(entry?.created_at),
            entry?.activity || "",
            entry?.test_type || entry?.type || "",
            entry?.vo2 ?? entry?.value ?? "",
            entry?.kcal ?? "",
            entry?.distance ?? "",
            entry?.mets ?? "",
            entry?.duration ?? "",
          ]),
          styles: { fontSize: 9 },
          theme: "grid",
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }

      if (selected.nutrition) {
        renderSectionTitle("Nutrition");
        autoTable(doc, {
          startY: currentY,
          head: [["Date", "Kcal", "Protein", "Carbs", "Fat"]],
          body: filteredIntakeLogs.map((entry) => [
            formatDate(entry?.date),
            entry?.kcal ?? "",
            entry?.protein ?? "",
            entry?.carbs ?? "",
            entry?.fat ?? "",
          ]),
          styles: { fontSize: 9 },
          theme: "grid",
        });
        currentY = doc.lastAutoTable.finalY + 8;

        if (latestMealPlanSummary.filledSlots > 0) {
          renderSectionTitle("Latest Meal Plan Snapshot");
          autoTable(doc, {
            startY: currentY,
            head: [["Slot", "Meal"]],
            body: latestMealPlanSummary.sampleMeals.map((item) => [
              item.slot,
              item.meal,
            ]),
            styles: { fontSize: 9 },
            theme: "striped",
          });
          currentY = doc.lastAutoTable.finalY + 8;
        }
      }

      if (selected.recovery) {
        renderSectionTitle("Recovery");
        autoTable(doc, {
          startY: currentY,
          head: [["Date", "Recovery", "Sleep", "Energy", "Mood", "Pain", "Stress"]],
          body: filteredRecoveryLogs.map((entry) => [
            formatDate(entry?.timestamp || entry?.date),
            entry?.recoveryScore ?? "",
            entry?.sleep ?? "",
            entry?.energy ?? "",
            entry?.mood ?? "",
            entry?.pain ?? "",
            entry?.stress ?? "",
          ]),
          styles: { fontSize: 9 },
          theme: "grid",
        });
      }

      doc.save(`healths-spot-report-${dateRange}.pdf`);
      setStatusMessage("✅ Το PDF export ολοκληρώθηκε.");
    } catch (error) {
      console.error("PDF export failed:", error);
      setErrorMessage("Αποτυχία δημιουργίας PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const applyPreset = (preset) => {
    if (preset === "performance") {
      setSelected({
        strength: true,
        cardio: true,
        nutrition: false,
        recovery: true,
      });
      return;
    }

    if (preset === "nutrition") {
      setSelected({
        strength: false,
        cardio: false,
        nutrition: true,
        recovery: false,
      });
      return;
    }

    if (preset === "recovery") {
      setSelected({
        strength: false,
        cardio: false,
        nutrition: false,
        recovery: true,
      });
      return;
    }

    setSelected(defaultSelected);
  };

  const toggleOption = (key) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const statCards = [
    {
      key: "strength",
      title: "Strength logs",
      value: strengthSummary.count,
      hint: strengthSummary.best1RM
        ? `Best 1RM ${strengthSummary.best1RM} kg`
        : "No 1RM yet",
    },
    {
      key: "cardio",
      title: "Cardio logs",
      value: cardioSummary.count,
      hint: cardioSummary.avgVo2
        ? `Avg VO₂ ${cardioSummary.avgVo2}`
        : "No VO₂ data yet",
    },
    {
      key: "nutrition",
      title: "Nutrition logs",
      value: nutritionSummary.count,
      hint: nutritionSummary.avgKcal
        ? `Avg kcal ${nutritionSummary.avgKcal}`
        : "No intake logs yet",
    },
    {
      key: "recovery",
      title: "Recovery check-ins",
      value: recoverySummary.count,
      hint: recoverySummary.avgRecovery
        ? `Avg recovery ${recoverySummary.avgRecovery}/5`
        : "No recovery history yet",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
      className={`min-h-screen px-4 py-8 md:px-6 xl:px-8 ${pageClass}`}
    >
      <Helmet>
        <title>Export & Reports Hub | Health's Spot</title>
        <meta
          name="description"
          content="Export hub για Strength, Cardio, Nutrition και Recovery με report presets, date range και καθαρό PDF/CSV export στο Health's Spot."
        />
      </Helmet>

      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 md:text-4xl">
              Export & Reports Hub
            </h1>
            <p className={`mt-1 text-sm md:text-base ${mutedTextClass}`}>
              Αυτό είναι export center, όχι ντυμένο metrics table που βαφτίζει το
              BMR "strength" και ελπίζει να μην το προσέξεις.
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
              onClick={handlePdfExport}
              disabled={isExportingPdf}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingPdf ? "Creating PDF..." : "📄 PDF Export"}
            </button>

            <button
              onClick={handleCsvExport}
              disabled={isExportingCsv}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingCsv ? "Creating CSV..." : "🧾 CSV Export"}
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = moduleMeta[card.key].icon;

            return (
              <div key={card.key} className={`${panelClass} p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>
                    {card.title}
                  </p>
                  <Icon className={`h-4 w-4 ${moduleMeta[card.key].accent}`} />
                </div>

                <p className="mt-2 text-3xl font-bold">{card.value}</p>
                <p className={`mt-2 text-xs ${mutedTextClass}`}>{card.hint}</p>
              </div>
            );
          })}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="space-y-6 xl:col-span-4">
            <div className={`${panelClass} p-5 md:p-6`}>
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5 text-cyan-400" />
                <h2 className="text-xl font-semibold">Report Controls</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <p className={`mb-3 text-sm font-semibold ${mutedTextClass}`}>
                    Presets
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => applyPreset("performance")}
                      className="rounded-xl bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700"
                    >
                      Performance Snapshot
                    </button>

                    <button
                      onClick={() => applyPreset("nutrition")}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Nutrition Summary
                    </button>

                    <button
                      onClick={() => applyPreset("recovery")}
                      className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                    >
                      Recovery Snapshot
                    </button>

                    <button
                      onClick={() => applyPreset("full")}
                      className="rounded-xl bg-yellow-500 px-3 py-2 text-sm font-semibold text-black hover:bg-yellow-600"
                    >
                      Full Health Report
                    </button>
                  </div>
                </div>

                <div>
                  <p className={`mb-3 text-sm font-semibold ${mutedTextClass}`}>
                    Date Range
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "7d", label: "7 ημέρες" },
                      { key: "30d", label: "30 ημέρες" },
                      { key: "90d", label: "90 ημέρες" },
                      { key: "all", label: "Όλα" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setDateRange(option.key)}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                          dateRange === option.key
                            ? "bg-cyan-600 text-white"
                            : isDark
                            ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={`mb-3 text-sm font-semibold ${mutedTextClass}`}>
                    Included Sections
                  </p>

                  <div className="space-y-3">
                    {Object.keys(selected).map((key) => {
                      const meta = moduleMeta[key];
                      const Icon = meta.icon;

                      return (
                        <label
                          key={key}
                          className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                            isDark
                              ? "border-white/10 bg-white/5"
                              : "border-black/5 bg-zinc-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`h-4 w-4 ${meta.accent}`} />
                            <span className="font-medium">{meta.label}</span>
                          </div>

                          <input
                            type="checkbox"
                            checked={selected[key]}
                            onChange={() => toggleOption(key)}
                            className="h-5 w-5 accent-cyan-600"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className={`${panelClass} p-5 md:p-6`}>
              <div className="mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-yellow-400" />
                <h2 className="text-xl font-semibold">Export Notes</h2>
              </div>

              <div className={`space-y-3 text-sm leading-6 ${mutedTextClass}`}>
                <p>
                  • Strength και Cardio τραβιούνται από τα πραγματικά logs, όχι από
                  βαφτισμένα proxy fields.
                </p>
                <p>
                  • Nutrition βασίζεται σε intake logs και στο πιο πρόσφατο saved
                  meal plan snapshot.
                </p>
                <p>
                  • Recovery τραβιέται από τα recovery entries του strength_logs για
                  να μένει συμβατό με το υπόλοιπο app.
                </p>
                {!user && (
                  <p className="text-amber-400">
                    Δεν υπάρχει signed-in user, οπότε user-scoped nutrition /
                    metrics data μπορεί να είναι άδεια.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6 xl:col-span-8">
            {(statusMessage || errorMessage) && (
              <div className="space-y-3">
                {statusMessage && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {statusMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {errorMessage}
                  </div>
                )}
              </div>
            )}

            <div className={`${panelClass} p-5 md:p-6`}>
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-yellow-400">
                    Report Preview
                  </h2>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    Ζωντανό preview του report πριν το export. Να βλέπεις τι
                    βγάζεις, όχι να προσεύχεσαι και να πατάς κουμπί.
                  </p>
                </div>

                <div
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${subtlePanelClass}`}
                >
                  Range: {dateRange.toUpperCase()}
                </div>
              </div>

              {isLoading ? (
                <p className={mutedTextClass}>Φόρτωση export datasets...</p>
              ) : previewSections.length === 0 ? (
                <p className={mutedTextClass}>
                  Δεν έχει επιλεγεί κανένα section ή δεν υπάρχουν δεδομένα στο range
                  που διάλεξες.
                </p>
              ) : (
                <div className="space-y-4">
                  {previewSections.map((section) => (
                    <div key={section.key} className={`${subtlePanelClass} p-4`}>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h3 className={`text-lg font-bold ${moduleMeta[section.key].accent}`}>
                          {section.title}
                        </h3>

                        <div className="flex flex-wrap gap-2 text-xs">
                          {section.summary.map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-black/20 px-3 py-1 font-semibold"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {section.rows.length === 0 ? (
                          <p className={mutedTextClass}>
                            Δεν υπάρχουν εγγραφές σε αυτό το range.
                          </p>
                        ) : (
                          section.rows.map((row, index) => (
                            <div
                              key={`${section.key}-${index}`}
                              className={`rounded-xl border px-4 py-3 ${
                                isDark
                                  ? "border-white/10 bg-zinc-950/60"
                                  : "border-black/5 bg-white"
                              }`}
                            >
                              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                <p className="font-semibold">{row.main}</p>
                                <span className={`text-xs ${mutedTextClass}`}>
                                  {row.date}
                                </span>
                              </div>

                              <p className={`mt-1 text-sm ${mutedTextClass}`}>
                                {row.detail}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}

                  {latestMetrics && (
                    <div className={`${subtlePanelClass} p-4`}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-pink-400" />
                        <h3 className="text-lg font-bold text-pink-400">
                          Latest Dashboard Metrics
                        </h3>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {[
                          ["BMR", latestMetrics.bmr],
                          ["VO₂max", latestMetrics.vo2max],
                          ["Protein", latestMetrics.protein],
                          ["Carbs", latestMetrics.carbs],
                          ["Fat", latestMetrics.fat],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className={`rounded-xl border px-4 py-3 ${
                              isDark
                                ? "border-white/10 bg-zinc-950/60"
                                : "border-black/5 bg-white"
                            }`}
                          >
                            <p className={`text-xs uppercase tracking-wide ${mutedTextClass}`}>
                              {label}
                            </p>
                            <p className="mt-1 text-lg font-bold">{value ?? "-"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}