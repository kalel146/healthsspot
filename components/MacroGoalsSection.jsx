import React from "react";
import CollapsibleSection from "../CollapsibleSection";
import MacroSlider from "../MacroSlider";
import MacroPieChart from "../MacroPieChart";
import PreferenceSelector from "../PreferenceSelector";

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
}) {
  return (
    <CollapsibleSection title="🥗 Διατροφικοί Στόχοι (Macros)">
      <div className="space-y-6">
        <div className="flex gap-4 items-center">
          <button
            onClick={generateMealPlanFromTargets}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
            aria-label="Αυτόματη Δημιουργία Πλάνου"
          >
            🧠 Αυτόματο Εβδομαδιαίο Πλάνο
          </button>
          <span
            className="text-xs text-gray-500"
            title="Χρησιμοποιεί τις τιμές macros και στόχους για να δημιουργήσει εβδομαδιαίο πρόγραμμα γευμάτων"
          >
            ⓘ
          </span>
        </div>

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

        <>
          <p>
            Πρωτεΐνη: {(protein * weight).toFixed(0)}g | Λίπος: {(fat * weight).toFixed(0)}g | Υδατάνθρακες: {Number(carbs || 0).toFixed(0)}g
          </p>
          <MacroPieChart pieData={pieData} theme={theme === "dark" ? "dark" : "light"} />
        </>

        <PreferenceSelector
          value={preference}
          onChange={setPreference}
          tooltip="Επιλογή διατροφικής προτίμησης (π.χ. χορτοφαγική, χαμηλών υδατανθράκων)"
        />

        <button
          onClick={handleGenerateAIPlan}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          aria-label="Δημιουργία AI πλάνου"
        >
          🤖 Δημιούργησε AI Πλάνο
        </button>
      </div>
    </CollapsibleSection>
  );
}
