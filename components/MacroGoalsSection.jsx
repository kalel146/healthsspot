import React from "react";
import CollapsibleSection from "../CollapsibleSection";
import MacroSlider from "../MacroSlider";
import MacroPieChart from "../MacroPieChart";

export default function MacroGoalsSection({
  protein,
  setProtein,
  fat,
  setFat,
  weight,
  carbs,
  pieData,
  theme,
  preference,
  setPreference,
  getProteinLabel,
  getFatLabel,
  generateMealPlanFromTargets,
  handleGenerateAIPlan,
  ui,
}) {
  const targetProtein = (Number(protein) || 0) * (Number(weight) || 0);
  const targetFat = (Number(fat) || 0) * (Number(weight) || 0);
  const targetCarbs = Number(carbs || 0);

  return (
    <CollapsibleSection title="🥗 Διατροφικοί Στόχοι (Macros)">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={generateMealPlanFromTargets}
            className={ui?.successButton || "bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"}
            aria-label="Αυτόματη Δημιουργία Πλάνου"
          >
            🧠 Αυτόματο Εβδομαδιαίο Πλάνο
          </button>

          <button
            onClick={handleGenerateAIPlan}
            className={ui?.primaryButton || "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"}
            aria-label="Δημιουργία AI πλάνου"
          >
            🤖 Δημιούργησε AI Πλάνο
          </button>

          <span
            className={ui?.helper || "text-xs text-gray-500"}
            title="Χρησιμοποιεί τις τιμές macros και τον τύπο διατροφής για να δημιουργήσει εβδομαδιαίο πρόγραμμα γευμάτων"
          >
            ⓘ Με βάση macros + preference
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
            <div className="space-y-4">
              <MacroSlider
                label="Πρωτεΐνη (g/kg)"
                value={protein}
                setValue={setProtein}
                min={0.5}
                max={3}
                step={0.1}
                tooltip="Πόσα γραμμάρια πρωτεΐνης ανά κιλό βάρους."
                labelFunction={getProteinLabel}
              />

              <MacroSlider
                label="Λίπος (g/kg)"
                value={fat}
                setValue={setFat}
                min={0.3}
                max={2}
                step={0.1}
                tooltip="Πόσα γραμμάρια λίπους ανά κιλό βάρους."
                labelFunction={getFatLabel}
              />
            </div>
          </div>

          <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
            <div className="space-y-3">
              <div>
                <label htmlFor="macro-preference" className={ui?.label || "block text-sm font-semibold"}>
                  Προτίμηση Διατροφής
                </label>
                <p className={ui?.helper || "text-xs text-gray-500"}>
                  Ορίζει το μοτίβο επιλογής γευμάτων όταν φτιάχνεται αυτόματα το πλάνο.
                </p>
              </div>

              <select
                id="macro-preference"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className={ui?.input || "mt-1 p-2 border rounded w-full"}
              >
                <option value="default">Κανονικό</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="lowcarb">Χαμηλοί Υδατάνθρακες</option>
              </select>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className={ui?.badge || "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"}>🎯 {targetProtein.toFixed(0)}g πρωτεΐνη</span>
                <span className={ui?.badge || "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"}>🥑 {targetFat.toFixed(0)}g λίπος</span>
                <span className={ui?.badge || "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"}>🍞 {targetCarbs.toFixed(0)}g υδατάνθρακες</span>
              </div>

              <p className={ui?.mutedText || "text-sm text-gray-600"}>
                Οι υδατάνθρακες βγαίνουν δυναμικά από το συνολικό ενεργειακό budget αφού οριστούν πρωτεΐνη και λίπος.
              </p>
            </div>
          </div>
        </div>

        <div className={ui?.metricCard || "rounded-2xl border p-4"}>
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] items-center">
            <div className="space-y-2">
              <h3 className={ui?.label || "text-sm font-semibold"}>Σύνοψη στόχων</h3>
              <p className={ui?.mutedText || "text-sm text-gray-600"}>
                Πρωτεΐνη: {targetProtein.toFixed(0)}g | Λίπος: {targetFat.toFixed(0)}g | Υδατάνθρακες: {targetCarbs.toFixed(0)}g
              </p>
              <p className={ui?.helper || "text-xs text-gray-500"}>
                Το pie chart σε βοηθά να δεις γρήγορα αν η κατανομή είναι λογική ή αν το πλάνο έχει ξεφύγει.
              </p>
            </div>

            <div className="min-h-[220px]">
              <MacroPieChart pieData={pieData} theme={theme === "dark" ? "dark" : "light"} />
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
