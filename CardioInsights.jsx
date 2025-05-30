import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { Bot, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function CardioInsights({ activity, history }) {
  const filtered = history.filter((e) => activity === "Όλα" || e.activity === activity);
  useEffect(() => {
    fetchInsights();
  }, []);

    const fetchInsights = async () => {
    const { data } = await supabase
      .from("cardio_logs")
      .select("created_at, vo2, kcal")
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const grouped = data.reduce((acc, entry) => {
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

      const best = summary.reduce((best, cur) => cur.avgVO2 > best.avgVO2 ? cur : best, summary[0]);
      setInsights({ summary, best });
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);
  
  if (filtered.length < 2) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-xl shadow-md text-yellow-800 dark:text-yellow-200">
        <p>⚠️ Δεν υπάρχουν αρκετά δεδομένα για να εμφανιστεί στατιστική ανάλυση.</p>
      </div>
    );
  }

  const avgVO2 = (
    filtered.reduce((sum, e) => sum + (e.VO2 || 0), 0) / filtered.filter(e => e.VO2).length
  ).toFixed(1);

  const totalKcal = filtered.reduce((sum, e) => sum + (e.kcal || 0), 0).toFixed(0);

  const getWeek = (dateStr) => {
    const date = new Date(dateStr);
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return `Εβδ ${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
  };

  const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

  return (
    <motion.div
      className="p-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-yellow-500 flex gap-2 items-center">
        <BarChart3 className="w-6 h-6" /> Cardio Insights
      </h1>

      {insights ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <h2 className="text-lg font-semibold mb-2">📈 Εβδομαδιαία Στατιστικά</h2>
            <ul className="list-disc pl-5 space-y-1">
              {insights.summary.map((entry) => (
                <li key={entry.week}>
                  <strong>{entry.week}:</strong> VO2avg {entry.avgVO2.toFixed(1)}, Θερμίδες: {entry.totalKcal.toFixed(0)} kcal
                </li>
              ))}
            </ul>
          </div>

           <section className="max-w-4xl mx-auto space-y-4 p-6 rounded-xl shadow-xl bg-white dark:bg-gray-900">
      <h2 className="text-xl font-semibold flex items-center gap-2 text-purple-500">
        <Bot className="w-5 h-5" /> Insights για {activity}
      </h2>
      <p>📈 Μέση VO2max: <strong>{avgVO2} mL/kg/min</strong></p>
      <p>🔥 Συνολικές θερμίδες: <strong>{totalKcal} kcal</strong></p>
      <p>
        💡 Συμβουλή: {avgVO2 < 30
          ? "Η καρδιοαναπνευστική σου κατάσταση είναι χαμηλή – αύξησε τη διάρκεια ή ένταση."
          : avgVO2 < 45
          ? "Καλή VO2max – συνέχισε σταθερά με στόχο τη βελτίωση."
          : "Εξαιρετική VO2max! Συντήρησε με έξυπνη περιοδικότητα."}
      </p>
    </section>

          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl shadow-inner">
            <p className="font-medium flex gap-2 items-center">
              <Bot className="w-4 h-4" /> 🏆 Καλύτερη Εβδομάδα: <strong>{insights.best.week}</strong> με VO2avg {insights.best.avgVO2.toFixed(1)}
            </p>
          </div>
        </div>
      ) : (
        <p>Φόρτωση δεδομένων...</p>
      )}
    </motion.div>
  );
}
