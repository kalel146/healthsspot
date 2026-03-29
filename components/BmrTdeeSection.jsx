import React, { useMemo } from "react";
import CollapsibleSection from "../CollapsibleSection";

export default function BmrTdeeSection({
  theme,
  ui,
  weight,
  setWeight,
  height,
  setHeight,
  age,
  setAge,
  gender,
  setGender,
  activity,
  setActivity,
  calculateNutrition,
  bmr,
  tdee,
}) {
  const forcedFieldStyle = useMemo(
    () => ({
      backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
      color: theme === "dark" ? "#f4f4f5" : "#18181b",
      WebkitTextFillColor: theme === "dark" ? "#f4f4f5" : "#18181b",
      caretColor: "#facc15",
      borderColor: theme === "dark" ? "#27272a" : "#d4d4d8",
    }),
    [theme]
  );

  const summaryTone =
    theme === "dark"
      ? "rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm"
      : "rounded-2xl border border-zinc-200 bg-zinc-50/90 p-4 shadow-sm";

  return (
    <CollapsibleSection title="🧮 Υπολογισμός BMR / TDEE">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={ui?.label}>⚖️ Βάρος (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              placeholder="π.χ. 70"
              className={ui?.input}
              style={forcedFieldStyle}
            />
          </div>

          <div>
            <label className={ui?.label}>📏 Ύψος (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              placeholder="π.χ. 175"
              className={ui?.input}
              style={forcedFieldStyle}
            />
          </div>

          <div>
            <label className={ui?.label}>🎂 Ηλικία</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              placeholder="π.χ. 25"
              className={ui?.input}
              style={forcedFieldStyle}
            />
          </div>

          <div>
            <label className={ui?.label}>👤 Φύλο</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={ui?.input}
              style={forcedFieldStyle}
            >
              <option value="male">Άνδρας</option>
              <option value="female">Γυναίκα</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={ui?.label}>🏃‍♂️ Επίπεδο δραστηριότητας</label>
            <select
              value={activity}
              onChange={(e) => setActivity(Number(e.target.value))}
              className={ui?.input}
              style={forcedFieldStyle}
            >
              <option value={1.2}>Καθιστική ζωή</option>
              <option value={1.375}>Ελαφριά δραστηριότητα</option>
              <option value={1.55}>Μέτρια δραστηριότητα</option>
              <option value={1.725}>Έντονη δραστηριότητα</option>
              <option value={1.9}>Πολύ έντονη δραστηριότητα</option>
            </select>
            <p className={`mt-2 ${ui?.helper}`}>
              Κράτα το activity factor ρεαλιστικό. Αν βάλεις “πολύ έντονη δραστηριότητα” ενώ κάθεσαι σαν βράχος, θα πάρεις TDEE φαντασίας.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={calculateNutrition} className={ui?.successButton}>
            🔍 Υπολόγισε
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={summaryTone}>
            <p className={ui?.helper}>BMR</p>
            <p className="mt-2 text-2xl font-bold">{bmr ?? "—"} kcal</p>
            <p className={`mt-2 ${ui?.mutedText}`}>
              Βασικός μεταβολικός ρυθμός. Αυτό είναι το “πόσα καις ζωντανός”, όχι “πόσα καις επειδή νομίζεις ότι είσαι δραστήριος”.
            </p>
          </div>

          <div className={summaryTone}>
            <p className={ui?.helper}>TDEE</p>
            <p className="mt-2 text-2xl font-bold">{tdee ?? "—"} kcal</p>
            <p className={`mt-2 ${ui?.mutedText}`}>
              Συνολικές ημερήσιες ενεργειακές ανάγκες με activity factor. Από εδώ ξεκινά κάθε σοβαρή ρύθμιση macros.
            </p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
