import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Bot, BarChart3, AlertTriangle, Eye, EyeOff, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function CardioInsights({ activity, history }) {
  const [insights, setInsights] = useState(null);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [aiFeedback, setAiFeedback] = useState([]);
  const [showFeedback, setShowFeedback] = useState(true);
  const [calendarDates, setCalendarDates] = useState([]);
  const [dateRange, setDateRange] = useState("Όλα");
  const [activityAverages, setActivityAverages] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [highlightedMaxDate, setHighlightedMaxDate] = useState(null);
  const [weeklyDelta, setWeeklyDelta] = useState(null);

  const getWeek = (dateStr) => {
    const date = new Date(dateStr);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return `Εβδ ${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
  };

  const average = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const fetchInsights = async () => {
    const { data } = await supabase
      .from("cardio_logs")
      .select("created_at, vo2, kcal, activity")
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      let filtered = activity === "Όλα" ? data : data.filter((entry) => entry.activity === activity);

      if (dateRange !== "Όλα") {
        const now = new Date();
        let fromDate;
        switch (dateRange) {
          case "4w":
            fromDate = new Date(now.setDate(now.getDate() - 28));
            break;
          case "2m":
            fromDate = new Date(now.setMonth(now.getMonth() - 2));
            break;
          case "6m":
            fromDate = new Date(now.setMonth(now.getMonth() - 6));
            break;
          default:
            fromDate = null;
        }
        if (fromDate) {
          filtered = filtered.filter((entry) => new Date(entry.created_at) >= fromDate);
        }
      }

      if (selectedDate) {
        const day = selectedDate.toDateString();
        filtered = filtered.filter((entry) => new Date(entry.created_at).toDateString() === day);
      }

      setFilteredHistory(filtered);

      const grouped = filtered.reduce((acc, entry) => {
        const week = getWeek(entry.created_at);
        if (!acc[week]) acc[week] = { vo2: [], kcal: [] };
        if (entry.vo2) acc[week].vo2.push(Number(entry.vo2));
        if (entry.kcal) acc[week].kcal.push(Number(entry.kcal));
        return acc;
      }, {});

      const summary = Object.entries(grouped).map(([week, values]) => {
        const avgVO2 = average(values.vo2);
        const totalKcal = values.kcal.reduce((a, b) => a + b, 0);
        return { week, avgVO2, totalKcal };
      });

      const best = summary.length
        ? summary.reduce((best, cur) => (cur.avgVO2 > best.avgVO2 ? cur : best), summary[0])
        : { week: "-", avgVO2: 0, totalKcal: 0 };

      const feedback = [];
      for (let i = 2; i < summary.length; i++) {
        const w1 = summary[i - 2];
        const w2 = summary[i - 1];
        const w3 = summary[i];
        if (w1.avgVO2 > w2.avgVO2 && w2.avgVO2 > w3.avgVO2) {
          feedback.push(`⚠️ Πτώση VO2max για 2 συνεχόμενες εβδομάδες ως την ${w3.week}. Μείωσε ένταση/όγκο και ανάκαμψε.`);
        }
        if (w1.totalKcal < w2.totalKcal && w2.totalKcal < w3.totalKcal) {
          feedback.push(`💪 Αυξητική τάση στις θερμίδες ως την ${w3.week}. Συνέχισε έτσι!`);
        }
        const vo2Change = Math.abs(w3.avgVO2 - w1.avgVO2);
        const kcalChange = Math.abs(w3.totalKcal - w1.totalKcal);
        if (vo2Change < 1 && kcalChange < 100) {
          feedback.push(`😴 Στασιμότητα σε VO2 και kcal για 3 εβδομάδες ως την ${w3.week}. Δοκίμασε νέο stimulus.`);
        }
      }

      if (summary.length > 2) {
        const latest = summary.at(-1);
        const previous = summary.at(-2);
        setWeeklyDelta({
          deltaVO2: latest.avgVO2 - previous.avgVO2,
          deltaKcal: latest.totalKcal - previous.totalKcal,
        });
        if (latest.avgVO2 > 45) {
          feedback.push("🚀 Είσαι σε elite επίπεδο VO2max. Σκέψου να δοκιμάσεις προγράμματα με intervals και tapering.");
        } else if (latest.avgVO2 < 30) {
          feedback.push("🔄 Δοκίμασε να αυξήσεις τη διάρκεια ή συχνότητα των sessions για να ξεκολλήσεις.");
        }
        if (latest.totalKcal < 500) {
          feedback.push("🥱 Οι θερμίδες σου είναι χαμηλές – ίσως υπολογίζεις λάθος ή η διάρκεια είναι πολύ μικρή.");
        }
      }

      if (summary.length > 1) {
        const current = summary.at(-1);
        const previous = summary.at(-2);
        if (current.avgVO2 > previous.avgVO2 && current.totalKcal > previous.totalKcal) {
          feedback.push("📈 Βελτίωση VO2max και θερμιδικής κατανάλωσης από την προηγούμενη εβδομάδα. Keep it up!");
        }
        if (current.avgVO2 < previous.avgVO2 && current.totalKcal > previous.totalKcal) {
          feedback.push("⚖️ Ίσως υπερπροπόνηση; Μείωσε ένταση ή δοκίμασε active recovery.");
        }
        if (current.avgVO2 > previous.avgVO2 && current.totalKcal < previous.totalKcal) {
          feedback.push("🎯 Πιο αποδοτικές προπονήσεις – VO2 ανέβηκε με λιγότερες kcal. Μπράβο!");
        }
      }

      const dates = filtered.map((entry) => new Date(entry.created_at));
      setCalendarDates(dates);

      // 🔥 Highlight ημέρας με max VO2
      const bestVo2Entry = data.reduce(
        (max, entry) => (entry.vo2 && (!max || entry.vo2 > max.vo2) ? entry : max),
        null
      );
      if (bestVo2Entry) {
        setHighlightedMaxDate(new Date(bestVo2Entry.created_at));
      }

      setInsights({ summary, best });
      setAiFeedback(feedback);

      const avgByActivity = data.reduce((acc, entry) => {
        const act = entry.activity || "Άγνωστο";
        if (!acc[act]) acc[act] = { vo2: [], kcal: [] };
        if (entry.vo2) acc[act].vo2.push(Number(entry.vo2));
        if (entry.kcal) acc[act].kcal.push(Number(entry.kcal));
        return acc;
      }, {});

      const activityAvgs = Object.entries(avgByActivity).map(([act, vals]) => ({
        activity: act,
        avgVO2: average(vals.vo2).toFixed(1),
        totalKcal: vals.kcal.reduce((a, b) => a + b, 0).toFixed(0),
      }));

      setActivityAverages(activityAvgs);
    }
  };

  useEffect(() => {
    fetchInsights();
    // also refetch when selectedDate changes
  }, [activity, dateRange, selectedDate]);

  if (filteredHistory.length < 2) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-xl shadow-md text-yellow-800 dark:text-yellow-200">
        <p>⚠️ Δεν υπάρχουν αρκετά δεδομένα για να εμφανιστεί στατιστική ανάλυση.</p>
      </div>
    );
  }

  const avgVO2 = (
    filteredHistory.reduce((sum, e) => sum + (e.vo2 || 0), 0) /
    (filteredHistory.filter((e) => e.vo2).length || 1)
  ).toFixed(1);

  const totalKcal = filteredHistory
    .reduce((sum, e) => sum + (e.kcal || 0), 0)
    .toFixed(0);

  const tileClassName = ({ date, view }) => {
    if (view === "month") {
      const isSession = calendarDates.some((d) => d.toDateString() === date.toDateString());
      const isBest = highlightedMaxDate && highlightedMaxDate.toDateString() === date.toDateString();
      if (isBest) return "bg-purple-500 text-white rounded-full";
      if (isSession) return "bg-green-300 dark:bg-green-700 rounded-full";
    }
    return null;
  };

  return (
    <motion.div
      className="p-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-yellow-500 flex gap-2 items-center">
        <BarChart3 className="w-6 h-6" /> Cardio Insights
      </h1>

      <div className="flex justify-end mb-4 gap-2">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
        >
          <option value="Όλα">Όλα</option>
          <option value="4w">Τελευταίες 4 Εβδομάδες</option>
          <option value="2m">Τελευταίοι 2 Μήνες</option>
          <option value="6m">Τελευταίοι 6 Μήνες</option>
        </select>
        <button
          onClick={() => setSelectedDate(null)}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Επαναφορά Ημερομηνίας
        </button>
      </div>

      {weeklyDelta && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-800 text-blue-900 dark:text-white px-4 py-2 rounded-xl shadow-md">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm font-medium">
              Εβδομαδιαία Μεταβολή — VO2max: {weeklyDelta.deltaVO2.toFixed(1)} | kcal: {weeklyDelta.deltaKcal.toFixed(0)}
            </p>
          </div>
        </div>
      )}

      {aiFeedback.length > 0 && (
        <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 p-4 rounded-xl shadow-inner space-y-2">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="text-sm font-semibold underline flex items-center gap-1 text-purple-700 dark:text-purple-200 mb-2"
          >
            {showFeedback ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showFeedback ? "Απόκρυψη" : "Εμφάνιση"} AI Feedback
          </button>
          {showFeedback && aiFeedback.map((line, i) => (
            <p key={i}>
              <Sparkles className="w-4 h-4 inline-block mr-1" /> {line}
            </p>
          ))}
        </div>
      )}

      {insights && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow mt-6">
          <h2 className="text-lg font-semibold mb-2">📊 Εβδομαδιαίο Γράφημα VO2max & kcal</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={insights.summary} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis yAxisId="left" label={{ value: "VO2max", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: "kcal", angle: 90, position: "insideRight" }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="avgVO2" name="Μέσο VO2max" />
              <Line yAxisId="right" type="monotone" dataKey="totalKcal" name="Σύνολο kcal" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">📆 Ημερολογιακή Εμφάνιση</h2>
          <Calendar tileClassName={tileClassName} onClickDay={(value) => setSelectedDate(value)} className="rounded-xl" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-2">📈 Εβδομαδιαία Στατιστικά</h2>
          {insights?.summary?.length ? (
            <ul className="list-disc pl-5 space-y-1">
              {insights.summary.map((entry) => (
                <li key={entry.week}>
                  <strong>{entry.week}:</strong> VO2avg {entry.avgVO2.toFixed(1)}, Θερμίδες: {entry.totalKcal.toFixed(0)} kcal
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Δεν υπάρχουν εβδομαδιαία δεδομένα.</p>
          )}
        </div>

        {activityAverages.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-2">📊 Σύγκριση Δραστηριοτήτων</h2>
            <ul className="list-disc pl-5 space-y-1">
              {activityAverages.map((act, i) => (
                <li key={i}>
                  <strong>{act.activity}</strong>: VO2avg {act.avgVO2} | Θερμίδες {act.totalKcal} kcal
                </li>
              ))}
            </ul>
          </div>
        )}

        <section className="max-w-4xl mx-auto space-y-2 p-6 rounded-xl shadow-xl bg-white dark:bg-gray-900">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-purple-500">
            <Bot className="w-5 h-5" /> Insights για {activity}
          </h2>
          <p>
            📈 Μέση VO2max: <strong>{avgVO2} mL/kg/min</strong>
          </p>
          <p>
            🔥 Συνολικές θερμίδες: <strong>{totalKcal} kcal</strong>
          </p>
          <p>
            💡 Συμβουλή: {avgVO2 < 30
              ? "Η καρδιοαναπνευστική σου κατάσταση είναι χαμηλή – αύξησε τη διάρκεια ή ένταση."
              : avgVO2 < 45
              ? "Καλή VO2max – συνέχισε σταθερά με στόχο τη βελτίωση."
              : "Εξαιρετική VO2max! Συντήρησε με έξυπνη περιοδικότητα."}
          </p>
        </section>

        {insights && (
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl shadow-inner">
            <p className="font-medium flex gap-2 items-center">
              <Bot className="w-4 h-4" /> 🏆 Καλύτερη Εβδομάδα: <strong>{insights.best.week}</strong> με VO2avg {insights.best.avgVO2.toFixed(1)}
            </p>
          </div>
        )}

        {aiFeedback.length > 0 && (
          <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 p-4 rounded-xl shadow-inner space-y-2">
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="text-sm font-semibold underline flex items-center gap-1 text-purple-700 dark:text-purple-200 mb-2"
            >
              {showFeedback ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showFeedback ? "Απόκρυψη" : "Εμφάνιση"} AI Feedback
            </button>
            {showFeedback && aiFeedback.map((line, i) => (
              <p key={i}>
                <Sparkles className="w-4 h-4 inline-block mr-1" /> {line}
              </p>
            ))}
          </div>
        )}

        {insights && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-2">📊 Αναλυτικά Εβδομαδιαία Στατιστικά</h2>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Εβδομάδα</th>
                  <th className="text-left">Μέσο VO2max</th>
                  <th className="text-left">Θερμίδες</th>
                </tr>
              </thead>
              <tbody>
                {insights.summary.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td>{row.week}</td>
                    <td>{row.avgVO2.toFixed(1)}</td>
                    <td>{row.totalKcal.toFixed(0)} kcal</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
