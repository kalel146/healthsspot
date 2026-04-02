import React, { useRef, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useTheme } from "./ThemeContext";
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

export default function CardioModule({ cardioHistory }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [mets, setMets] = useState(1);
  const [weight, setWeight] = useState(70);
  const [duration, setDuration] = useState(30);
  const [kcal, setKcal] = useState(null);
  const [activity, setActivity] = useState("Τρέξιμο");
  const [testType, setTestType] = useState("Cooper");
  const [distance, setDistance] = useState(2400);
  const [vo2max, setVo2max] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const [history, setHistory] = useState([]);
  const [advice, setAdvice] = useState("");
  const chartRef = useRef(null);

  const activities = ["Τρέξιμο", "Ποδήλατο", "Κολύμβηση", "HIIT", "Άλλο", "Όλα"];

  const [filterDate, setFilterDate] = useState("");
  const [weekFilter, setWeekFilter] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [weeklyDelta, setWeeklyDelta] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [expandedWeeks, setExpandedWeeks] = useState([]);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const toggleWeek = (week) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  const getWeekKey = (input) => {
    const date = new Date(input);
    return `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
  };

  const aiForecast = useMemo(() => {
    if (weeklyData.length < 2) return null;
    const lastTwo = weeklyData.slice(-2);
    const [prev, current] = lastTwo;
    const drop =
      parseFloat(current.avg) < parseFloat(prev.avg) && current.range > prev.range;

    if (drop && parseFloat(current.avg) < 40) {
      return {
        message:
          "📉 Πτώση απόδοσης και αυξημένη διακύμανση — μείωσε την ένταση και δώσε έμφαση στην αποκατάσταση την επόμενη εβδομάδα.",
        plan: ["2x προπονήσεις χαμηλής έντασης", "1x active recovery session"],
      };
    } else if (
      parseFloat(current.avg) > parseFloat(prev.avg) &&
      current.range < prev.range
    ) {
      return {
        message:
          "📈 Ανοδική τάση και σταθεροποίηση — μπορείς να προχωρήσεις σε πιο απαιτητικά sessions την επόμενη εβδομάδα.",
        plan: ["1x threshold run", "1x HIIT session"],
      };
    } else {
      return {
        message:
          "🔄 Οι επιδόσεις παραμένουν σταθερές — διατήρησε το ίδιο προπονητικό πλάνο για άλλη μία εβδομάδα.",
        plan: ["2x steady-state runs"],
      };
    }
  }, [weeklyData]);

  const regressionForecast = useMemo(() => {
    if (weeklyData.length < 3) return [];

    const x = weeklyData.map((_, i) => i);
    const y = weeklyData.map((entry) => parseFloat(entry.avg));
    const n = x.length;
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const numerator = x.reduce(
      (acc, xi, i) => acc + (xi - xMean) * (y[i] - yMean),
      0
    );
    const denominator = x.reduce(
      (acc, xi) => acc + Math.pow(xi - xMean, 2),
      0
    );

    if (!denominator) return [];

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    return x.map((xi) => ({
      week: weeklyData[xi].week,
      forecast: slope * xi + intercept,
    }));
  }, [weeklyData]);

  const getColorClass = (severity) => {
    switch (severity) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "excellent":
        return "text-green-500";
      default:
        return "text-gray-800 dark:text-white";
    }
  };

  const vo2Extremes = useMemo(() => {
    if (!cardioHistory || cardioHistory.length === 0) return null;

    return cardioHistory
      .filter((entry) => entry.type === "vo2max" && entry.value)
      .reduce(
        (acc, cur) => {
          if (!acc.peak || cur.value > acc.peak.value) {
            acc.peak = {
              value: Number(cur.value),
              date: cur.created_at.split("T")[0],
            };
          }
          if (!acc.dip || cur.value < acc.dip.value) {
            acc.dip = {
              value: Number(cur.value),
              date: cur.created_at.split("T")[0],
            };
          }
          return acc;
        },
        { peak: null, dip: null }
      );
  }, [cardioHistory]);

  useEffect(() => {
    if (!cardioHistory || cardioHistory.length === 0) return;

    const grouped = {};

    cardioHistory.forEach((entry) => {
      if (entry.type === "vo2max" && entry.value) {
        const week = getWeekKey(entry.created_at);
        if (!grouped[week]) grouped[week] = [];
        grouped[week].push({
          value: Number(entry.value),
          date: entry.created_at.split("T")[0],
        });
      }
    });

    const weeklyStats = Object.entries(grouped).map(([week, values]) => {
      const vo2Values = values.map((v) => v.value);
      const max = Math.max(...vo2Values);
      const min = Math.min(...vo2Values);
      const avg = vo2Values.reduce((a, b) => a + b, 0) / vo2Values.length;
      const range = max - min;
      let feedback = "";
      let severity = "normal";

      if (range > 15 && avg < 40) {
        feedback =
          "⚠ Υψηλή διακύμανση και χαμηλό VO2max — ενδείξεις κόπωσης ή κακής προσαρμογής.";
        severity = "high";
      } else if (range < 5 && avg < 35) {
        feedback =
          "📉 Σταθερά χαμηλό VO2max — πιθανή υπερκόπωση ή ανάγκη για ενεργητική αποκατάσταση.";
        severity = "medium";
      } else if (avg >= 50 && range <= 10) {
        feedback =
          "🏆 Σταθερά υψηλές επιδόσεις — εξαιρετική φυσική κατάσταση!";
        severity = "excellent";
      } else if (range > 10) {
        feedback =
          "⚠ Μεγάλη διακύμανση — σταθεροποίησε τις εντάσεις των προπονήσεων.";
        severity = "medium";
      } else {
        feedback = "✅ Καλή ισορροπία — συνέχισε έτσι.";
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
        dates: values.map((v) => v.date),
        sessions: cardioHistory.filter(
          (log) => getWeekKey(log.created_at) === week && log.type !== "vo2max"
        ),
      };
    });

    setWeeklyData(weeklyStats);

    if (weeklyStats.length >= 2) {
      const last = weeklyStats[weeklyStats.length - 1];
      const prev = weeklyStats[weeklyStats.length - 2];
      setWeeklyDelta({
        deltaVO2: parseFloat(last.avg) - parseFloat(prev.avg),
        deltaRange: last.range - prev.range,
      });
    }
  }, [cardioHistory]);

  const filteredData = useMemo(() => {
    return weeklyData.filter((entry) => {
      const matchesWeek = selectedWeek ? entry.week === selectedWeek : true;
      const matchesDate = selectedDate ? entry.dates.includes(selectedDate) : true;
      return matchesWeek && matchesDate;
    });
  }, [weeklyData, selectedWeek, selectedDate]);

  const generateAdvice = (data) => {
    const last3 = data.slice(-3).filter((d) => d.VO2);
    if (last3.length < 2) {
      setAdvice("⚠️ Δεν υπάρχουν αρκετά δεδομένα για αξιολόγηση προόδου.");
      return;
    }

    const trend = last3[last3.length - 1].VO2 - last3[0].VO2;
    let baseAdvice = "";

    if (trend > 1.5) {
      baseAdvice =
        "🚀 Η VO2max σου βελτιώνεται! Συνέχισε έτσι και προσπάθησε να διατηρείς σταθερή συχνότητα.";
    } else if (trend < -1.5) {
      baseAdvice =
        "📉 Η VO2max έχει πέσει. Ξεκουράσου επαρκώς, δες τη διατροφή σου και μείωσε το training load.";
    } else {
      baseAdvice =
        "📊 Η VO2max παραμένει σταθερή. Ίσως είναι ώρα να ανεβάσεις την ένταση ή διάρκεια.";
    }

    const weekMap = {};
    data.forEach((entry) => {
      const week = getWeekKey(entry.rawCreatedAt || entry.date);
      if (!weekMap[week]) weekMap[week] = { vo2Sum: 0, kcalSum: 0, count: 0 };
      if (entry.VO2) weekMap[week].vo2Sum += entry.VO2;
      if (entry.kcal) weekMap[week].kcalSum += entry.kcal;
      weekMap[week].count++;
    });

    const sortedWeeks = Object.entries(weekMap)
      .map(([week, stats]) => ({
        week,
        avgVO2: stats.vo2Sum / stats.count,
        totalKcal: stats.kcalSum,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    if (sortedWeeks.length >= 2) {
      const last = sortedWeeks[sortedWeeks.length - 1];
      const prev = sortedWeeks[sortedWeeks.length - 2];
      const deltaVO2 = last.avgVO2 - prev.avgVO2;
      const deltaKcal = last.totalKcal - prev.totalKcal;
      baseAdvice += `\n📈 Σύγκριση Εβδομάδων → VO2max: ${deltaVO2.toFixed(
        1
      )}, kcal: ${deltaKcal.toFixed(0)}`;
    }

    setAdvice(baseAdvice);
  };

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("cardio_logs")
      .select("created_at, vo2, kcal, activity, type, value")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fetch cardio history failed:", error);
      return;
    }

    const formatted = (data || []).map((entry) => ({
      date: new Date(entry.created_at).toLocaleDateString("el-GR"),
      rawCreatedAt: entry.created_at,
      VO2: entry.vo2 ? Number(entry.vo2) : entry.value ? Number(entry.value) : null,
      kcal: entry.kcal ? Number(entry.kcal) : null,
      activity: entry.activity || "Άλλο",
      type: entry.type || "",
    }));

    setHistory(formatted);
    generateAdvice(formatted);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const exportToExcel = async () => {
    if (isExportingExcel) return;

    try {
      setIsExportingExcel(true);

      const XLSX = await import("xlsx");

      const dataToExport = filteredData.map(
        ({ week, max, min, range, avg, feedback }) => ({
          Εβδομάδα: week,
          Μέγιστο: max,
          Ελάχιστο: min,
          Εύρος: range,
          ΜέσοςΌρος: avg,
          Feedback: feedback,
        })
      );

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "VO2 Insights");
      XLSX.writeFile(workbook, "VO2max_Weekly_Insights.xlsx");
    } catch (error) {
      console.error("Excel export failed:", error);
      alert("Αποτυχία εξαγωγής Excel.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  const calculateKcal = async () => {
    const vo2 = mets * 3.5 * weight;
    const kcalPerMin = (vo2 * 5) / 1000;
    const total = kcalPerMin * duration;
    const result = { vo2: vo2.toFixed(1), total: total.toFixed(1) };
    setKcal(result);

    await supabase.from("cardio_logs").insert({
      type: "kcal",
      mets,
      weight,
      duration,
      vo2: result.vo2,
      kcal: result.total,
      activity,
      created_at: new Date().toISOString(),
    });

    fetchHistory();
  };

  const calculateVO2max = async () => {
    let result = 0;
    if (testType === "Cooper") {
      result = (distance - 504.9) / 44.73;
    }

    const fixed = result.toFixed(1);
    setVo2max(fixed);

    await supabase.from("cardio_logs").insert({
      type: "vo2max",
      test_type: testType,
      value: fixed,
      distance,
      activity,
      created_at: new Date().toISOString(),
    });

    fetchHistory();
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

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
      pdf.save("cardio_report.pdf");
    } catch (error) {
      console.error("Cardio PDF export failed:", error);
      alert("Αποτυχία εξαγωγής PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExportingCsv) return;

    try {
      setIsExportingCsv(true);

      const rows = [["Ημερομηνία", "VO2max", "kcal", "Activity"]];

      const filtered = history.filter((entry) => {
        if (activity === "Όλα") return true;
        return entry.activity === activity;
      });

      filtered.forEach((entry) => {
        rows.push([
          entry.date,
          entry.VO2 ?? "",
          entry.kcal ?? "",
          entry.activity ?? "",
        ]);
      });

      const csvContent = rows.map((e) => e.join(",")).join("\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

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
      alert("Αποτυχία εξαγωγής CSV.");
    } finally {
      setIsExportingCsv(false);
    }
  };

  const inputClass = `p-3 rounded-xl shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all duration-300 ${
    theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"
  }`;
  const sectionClass =
    "space-y-4 max-w-xl mx-auto p-6 bg-opacity-70 rounded-2xl shadow-lg";

  const SectionHeader = ({ icon, color, children }) => (
    <h2 className={`text-2xl font-semibold flex items-center gap-2 text-${color}-500`}>
      {icon} {children}
    </h2>
  );

  const LabeledInput = ({ id, label, value, onChange, placeholder }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );

  return (
    <motion.div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-yellow-500 text-center">
        Cardio Module — Advanced Insights
      </h1>

      <CardioInsights history={cardioHistory} activity={"Όλα"} />

      <div className="relative z-30 mt-8 flex justify-center">
        <div className="w-fit">
          <h3 className="text-md font-semibold text-purple-600 mb-2 text-center">
            🗓 Ημερολογιακή Επισκόπηση
          </h3>
          <Calendar
            onChange={(date) => {
              const iso = date.toISOString().split("T")[0];
              setCalendarDate(date);
              setSelectedDate(iso);
            }}
            value={calendarDate}
            tileClassName={({ date }) => {
              const iso = date.toISOString().split("T")[0];
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
            className="rounded-lg shadow border border-gray-300"
          />
        </div>
      </div>

      {weeklyDelta && (
        <motion.div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-white px-4 py-2 rounded-xl shadow-md">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm font-medium">
              Εβδομαδιαία Μεταβολή — VO2max: {weeklyDelta.deltaVO2.toFixed(1)} |
              Εύρος: {weeklyDelta.deltaRange.toFixed(1)}
            </p>
          </div>
        </motion.div>
      )}

      <Helmet>
        <title>Cardio Module | Health's Spot</title>
        <meta
          name="description"
          content="Υπολόγισε METs, VO2max και θερμίδες στο Cardio Lab του Health’s Spot."
        />
        <meta
          name="keywords"
          content="cardio, vo2max, calories, fitness, METs"
        />
        <html lang="el" />
      </Helmet>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400 flex items-center gap-2">
          <HeartPulse className="w-6 h-6 animate-pulse" /> Cardio Lab
        </h1>
        <button
          onClick={toggleTheme}
          className="px-3 py-2 rounded-xl shadow font-semibold bg-yellow-400 text-black hover:bg-yellow-500 transition"
          title="Εναλλαγή Θέματος"
        >
          {theme === "dark" ? "☀" : "🌙"}
        </button>
      </div>

      <motion.section
        className={sectionClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <SectionHeader icon={<Flame className="w-5 h-5" />} color="green">
          Υπολογισμός kcal (MET ➝ VO2 ➝ kcal)
        </SectionHeader>

        <LabeledInput
          id="mets"
          label="METs"
          value={mets}
          onChange={(e) => setMets(e.target.value)}
        />
        <LabeledInput
          id="weight"
          label="Βάρος (kg)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <LabeledInput
          id="duration"
          label="Διάρκεια (λεπτά)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <button
          onClick={calculateKcal}
          className="bg-green-600 hover:bg-green-700 px-5 py-2 mt-2 rounded-xl text-white shadow"
        >
          Υπολόγισε kcal
        </button>

        {kcal && (
          <motion.p
            className="font-medium text-sm mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            VO2: <strong>{kcal.vo2}</strong> mL/min | kcal:{" "}
            <strong>{kcal.total}</strong> kcal συνολικά
          </motion.p>
        )}
      </motion.section>

      <motion.section
        className={sectionClass}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <SectionHeader icon={<Ruler className="w-5 h-5" />} color="blue">
          VO2max Test (Cooper)
        </SectionHeader>

        <div className="space-y-1">
          <span className="text-sm font-medium block">Τύπος Δραστηριότητας</span>
          <div className="flex flex-wrap gap-2">
            {activities
              .filter((act) => act !== "Όλα")
              .map((act) => (
                <button
                  key={act}
                  onClick={() => setActivity(act)}
                  className={`px-4 py-2 rounded-full font-medium border ${
                    activity === act
                      ? "bg-yellow-400 text-black border-yellow-500"
                      : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-gray-400"
                  }`}
                >
                  {act}
                </button>
              ))}
          </div>
        </div>

        <label htmlFor="vo2test" className="block text-sm font-medium">
          Επιλογή Τεστ VO2max
        </label>
        <select
          id="vo2test"
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
          className={inputClass}
        >
          <option value="Cooper">Cooper Test</option>
          <option value="Rockport" disabled>
            Rockport (υπό ανάπτυξη)
          </option>
          <option value="Step" disabled>
            Step Test (υπό ανάπτυξη)
          </option>
        </select>

        {testType === "Cooper" && (
          <LabeledInput
            id="cooper-distance"
            label="Απόσταση σε μέτρα (12 λεπτά)"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="π.χ. 2400"
          />
        )}

        <button
          onClick={calculateVO2max}
          className="bg-blue-600 hover:bg-blue-700 px-5 py-2 mt-2 rounded-xl text-white shadow"
        >
          Υπολόγισε VO2max
        </button>

        {vo2max && (
          <motion.p
            className="font-medium text-sm mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            VO2max: <strong>{vo2max}</strong> mL/kg/min
          </motion.p>
        )}
      </motion.section>

      <motion.section
        ref={chartRef}
        className="max-w-4xl mx-auto p-6 rounded-xl shadow-xl bg-white dark:bg-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <SectionHeader
          icon={<LineChartIcon className="w-5 h-5" />}
          color="yellow"
        >
          Ιστορικό VO2max και kcal
        </SectionHeader>

        <div className="flex flex-wrap gap-2 mb-4">
          {activities.map((act) => (
            <button
              key={act}
              onClick={() => setActivity(act)}
              className={`px-4 py-1 rounded-full text-sm font-medium border transition-all duration-200 ${
                activity === act
                  ? "bg-yellow-400 text-black border-yellow-600"
                  : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white border-gray-400"
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        {history.filter((h) => activity === "Όλα" || h.activity === activity).length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart
              data={history.filter(
                (h) => activity === "Όλα" || h.activity === activity
              )}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="VO2"
                stroke="#3b82f6"
                name="VO2max (mL/kg/min)"
              />
              <Line
                type="monotone"
                dataKey="kcal"
                stroke="#10b981"
                name="kcal (συνολικά)"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-sm text-gray-500 py-12">
            Δεν υπάρχουν ακόμη δεδομένα για το επιλεγμένο φίλτρο δραστηριότητας.
          </div>
        )}

        {advice && (
          <motion.div
            className="mt-6 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl shadow-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4" /> {advice.split("\n")[0]}
            </p>
          </motion.div>
        )}

        {advice.includes("Σύγκριση Εβδομάδων") && (
          <motion.div
            className="mt-4 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 p-4 rounded-xl shadow-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm font-medium flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" /> {advice.split("\n")[1]}
            </p>
          </motion.div>
        )}

        <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">📅 Φίλτρο ανά ημερομηνία:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setSelectedDate(e.target.value);
              }}
              className="p-2 rounded bg-white dark:bg-gray-700 border dark:border-gray-600"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {[...Array(6)].map((_, i) => (
              <button
                key={i}
                onClick={() => setWeekFilter(i + 20)}
                className={`px-3 py-1 rounded text-sm font-medium shadow-md whitespace-nowrap ${
                  weekFilter === i + 20
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                }`}
              >
                Εβδομάδα {i + 20}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Επιλογή Εβδομάδας:
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="p-2 rounded border dark:bg-gray-700 dark:text-white"
            >
              <option value="">Όλες</option>
              {weeklyData.map((w) => (
                <option key={w.week} value={w.week}>
                  {w.week}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Επιλογή Ημερομηνίας:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 rounded border dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              disabled={isExportingExcel}
              className="flex items-center gap-1 px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 shadow disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />{" "}
              {isExportingExcel ? "Exporting..." : "Export XLSX"}
            </button>
          </div>
        </div>

        {vo2Extremes?.peak && vo2Extremes?.dip ? (
          <motion.div className="mt-6 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
            <h2 className="text-lg font-semibold mb-2 text-indigo-500">
              📉 Διακύμανση VO2max
            </h2>
            <ul className="list-disc ml-5 space-y-1 text-sm">
              <li>
                📈 Peak επίδοση: {vo2Extremes.peak.value.toFixed(1)} mL/kg/min (
                {vo2Extremes.peak.date})
              </li>
              <li>
                📉 Χαμηλότερη τιμή: {vo2Extremes.dip.value.toFixed(1)} mL/kg/min (
                {vo2Extremes.dip.date})
              </li>
              <li>
                💡 Συμβουλή:{" "}
                {vo2Extremes.peak.value - vo2Extremes.dip.value > 10
                  ? "Η διακύμανση είναι μεγάλη — σταθεροποίησε την ένταση των προπονήσεων."
                  : "Καλή σταθερότητα στην απόδοσή σου — συνέχισε έτσι."}
              </li>
            </ul>
          </motion.div>
        ) : (
          <div className="mt-6 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow text-sm italic text-gray-500">
            Δεν υπάρχουν επαρκή δεδομένα για διακύμανση VO2max.
          </div>
        )}

        {filteredData.length > 0 && regressionForecast.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-blue-500 mb-2">
              📈 Προβλεπόμενη Τάση VO2max
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart
                data={filteredData.map((entry, i) => ({
                  ...entry,
                  forecast: regressionForecast[i]?.forecast || null,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#10b981"
                  name="Μέσος Όρος"
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#6366f1"
                  strokeDasharray="5 5"
                  name="Πρόβλεψη"
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center text-sm text-gray-500 py-12">
            Δεν υπάρχουν δεδομένα για την επιλεγμένη εβδομάδα ή ημερομηνία.
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-2 text-purple-500 flex gap-2 items-center">
            <Sparkles className="w-5 h-5" /> Συνοπτικά Insights
          </h2>
          <ul className="list-disc ml-6 text-sm space-y-1">
            <li>
              📈 Συνολικός μέσος VO2max:{" "}
              {weeklyData.length > 0
                ? (
                    weeklyData.reduce(
                      (acc, d) => acc + parseFloat(d.avg),
                      0
                    ) / weeklyData.length
                  ).toFixed(1)
                : "-"}
            </li>
            <li>
              🔍 Πιο σταθερή εβδομάδα:{" "}
              {weeklyData.reduce(
                (acc, w) => (w.range < acc.range ? w : acc),
                weeklyData[0] || {}
              ).week || "-"}
            </li>
            <li>
              ⚠ Εντονότερη πτώση:{" "}
              {vo2Extremes
                ? `${vo2Extremes.dip.value.toFixed(1)} mL/kg/min (${vo2Extremes.dip.date})`
                : "-"}
            </li>
            <li>
              🏔 Peak VO2max:{" "}
              {vo2Extremes
                ? `${vo2Extremes.peak.value.toFixed(1)} mL/kg/min (${vo2Extremes.peak.date})`
                : "-"}
            </li>
          </ul>
        </div>

        {filteredData.length > 0 && (
          <motion.div className="mt-6 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
            <h3 className="text-md font-semibold text-purple-500 mb-2">
              🤖 Εβδομαδιαία AI Ανάλυση
            </h3>
            <ul className="space-y-2 text-sm">
              {filteredData.map((entry) => (
                <li key={entry.week} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleWeek(entry.week)}
                    className={`w-full text-left px-4 py-2 font-semibold flex justify-between items-center ${getColorClass(
                      entry.severity
                    )}`}
                  >
                    <span>{entry.week}</span>
                    {expandedWeeks.includes(entry.week) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedWeeks.includes(entry.week) && (
                    <div className="px-4 pb-4 space-y-2">
                      <p>{entry.feedback}</p>
                      <ul className="list-disc ml-5 text-xs">
                        {entry.sessions.map((s, i) => (
                          <li key={i}>
                            {s.created_at.split("T")[0]} — {s.type} — {s.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        <motion.div className="mt-6 bg-white dark:bg-zinc-800 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-2 text-indigo-500">
            📊 Εβδομαδιαία Στατιστικά VO2max
          </h2>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {weeklyData.map((entry) => (
              <li key={entry.week} className={getColorClass(entry.severity)}>
                <strong>{entry.week}:</strong> Μέγιστο: {entry.max} mL/kg/min,
                Ελάχιστο: {entry.min} mL/kg/min, Μέσος Όρος: {entry.avg} mL/kg/min
              </li>
            ))}
          </ul>
        </motion.div>

        {aiForecast && (
          <motion.div className="mt-6 bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-white px-6 py-4 rounded-xl shadow space-y-3">
            <h3 className="text-md font-semibold">🔮 AI Forecast</h3>
            <p className="text-sm">{aiForecast.message}</p>
            <div>
              <h4 className="text-sm font-semibold mb-1">
                📋 Προτεινόμενο Πλάνο Προπόνησης:
              </h4>
              <ul className="list-disc ml-5 text-sm space-y-1">
                {aiForecast.plan.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleExportCSV}
            disabled={isExportingCsv}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />{" "}
            {isExportingCsv ? "Exporting CSV..." : "Export CSV"}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />{" "}
            {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
          </button>
        </div>
      </motion.section>

      <CardioInsights activity={activity} history={history} />
    </motion.div>
  );
}