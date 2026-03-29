import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import CollapsibleSection from "../CollapsibleSection";

const MEAL_TYPES = [
  { key: "breakfast", label: "🍽️ Πρωινό" },
  { key: "lunch", label: "🥗 Μεσημεριανό" },
  { key: "snack", label: "🥚 Σνακ" },
  { key: "dinner", label: "🍝 Βραδινό" },
];

const num = (value) => Number(value) || 0;

export default function AnalyticsSection({
  tdee,
  protein,
  fat,
  weight,
  carbs,
  intakeKcal,
  setIntakeKcal,
  macrosText,
  setMacrosText,
  inputStyle,
  totalMacros,
  planKcal,
  daysOrder,
  customMeals,
  allFoodsFull,
  saveMealsToSupabase,
  loadMealsFromSupabase,
  savePlanToSupabase,
  loadPlanFromSupabase,
  userId,
  exportToPDF,
  exportToCSV,
  sharePlan,
  intakeHistory,
  theme,
  ui,
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

  const targetProtein = num(protein) * num(weight);
  const targetFat = num(fat) * num(weight);
  const targetCarbs = num(carbs);

  const [pStr, fStr, cStr] = (macrosText || "").split("/");
  const actualIntakeMacros = {
    protein: num(pStr),
    fat: num(fStr),
    carbs: num(cStr),
  };

  const macroDeltas = {
    protein: targetProtein ? ((actualIntakeMacros.protein - targetProtein) / targetProtein) * 100 : 0,
    fat: targetFat ? ((actualIntakeMacros.fat - targetFat) / targetFat) * 100 : 0,
    carbs: targetCarbs ? ((actualIntakeMacros.carbs - targetCarbs) / targetCarbs) * 100 : 0,
  };

  const intakeDelta = intakeKcal === "" ? null : num(intakeKcal) - num(tdee);

  const weeklyTotals = useMemo(() => {
    return daysOrder.reduce(
      (acc, day) => {
        MEAL_TYPES.forEach(({ key }) => {
          const mealName = customMeals?.[`${day}-${key}`];
          const food = allFoodsFull.find((item) => item.name === mealName);
          if (!food) return;
          acc.protein += num(food.protein);
          acc.fat += num(food.fat);
          acc.carbs += num(food.carbs);
        });
        acc.kcal = acc.protein * 4 + acc.carbs * 4 + acc.fat * 9;
        return acc;
      },
      { protein: 0, fat: 0, carbs: 0, kcal: 0 }
    );
  }, [allFoodsFull, customMeals, daysOrder]);

  const suggestionCards = tdee
    ? [
        {
          label: "🎯 Cut",
          value: `${(tdee * 0.75).toFixed(0)} kcal`,
          note: "Περίπου 15–25% έλλειμμα. Χρήσιμο όταν ο στόχος είναι απώλεια λίπους χωρίς να γκρεμίσεις την προπόνηση.",
        },
        {
          label: "⚖️ Maintain",
          value: `${tdee} kcal`,
          note: "Συντήρηση. Η ασφαλής baseline όταν θες σταθερότητα και καθαρή εικόνα της πραγματικής σου απόκρισης.",
        },
        {
          label: "💪 Bulk",
          value: `${(tdee * 1.15).toFixed(0)} kcal`,
          note: "Περίπου 10–15% surplus. Χτίζεις χωρίς να το μετατρέψεις σε διαγωνισμό αποθήκευσης λίπους.",
        },
      ]
    : [];

  const statusTone =
    intakeDelta == null
      ? ui?.summaryBox
      : Math.abs(intakeDelta) <= 150
      ? ui?.metricCard
      : theme === "dark"
      ? "rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 shadow-sm"
      : "rounded-2xl border border-yellow-300 bg-yellow-50 p-4 shadow-sm";

  return (
    <div className="space-y-6">
      <CollapsibleSection title="📊 AI Προτάσεις & Στόχοι">
        {tdee !== null && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className={ui?.metricCard || "rounded-2xl border p-4"}>
                <p className={ui?.helper || "text-xs text-gray-500"}>Συνολικές Θερμίδες</p>
                <p className="mt-2 text-2xl font-bold">{tdee} kcal</p>
                <p className={ui?.mutedText || "text-sm text-gray-600"}>Το ενεργειακό σημείο αναφοράς σου. Από εδώ ξεκινάνε όλα, όχι από wishful thinking.</p>
              </div>

              <div className={ui?.metricCard || "rounded-2xl border p-4"}>
                <p className={ui?.helper || "text-xs text-gray-500"}>Πρωτεΐνη</p>
                <p className="mt-2 text-2xl font-bold">{targetProtein.toFixed(0)}g</p>
                <p className={ui?.mutedText || "text-sm text-gray-600"}>
                  {protein >= 2 ? "Υψηλή, άρα στέκεται σοβαρά για μυϊκή υποστήριξη." : "Οκ, αλλά όχι κάτι που φωνάζει “χτίζω επιθετικά”."}
                </p>
              </div>

              <div className={ui?.metricCard || "rounded-2xl border p-4"}>
                <p className={ui?.helper || "text-xs text-gray-500"}>Λίπος</p>
                <p className="mt-2 text-2xl font-bold">{targetFat.toFixed(0)}g</p>
                <p className={ui?.mutedText || "text-sm text-gray-600"}>
                  {fat < 0.6 ? "Χαμηλό. Μπορεί να βγει, αλλά θέλει προσοχή για να μη γίνει διατροφικό ξερό ψωμί." : "Σε λογικό εύρος για σταθερότητα και συμμόρφωση."}
                </p>
              </div>

              <div className={ui?.metricCard || "rounded-2xl border p-4"}>
                <p className={ui?.helper || "text-xs text-gray-500"}>Υδατάνθρακες</p>
                <p className="mt-2 text-2xl font-bold">{targetCarbs.toFixed(0)}g</p>
                <p className={ui?.mutedText || "text-sm text-gray-600"}>Ρυθμίζονται από το υπόλοιπο budget. Άρα εδώ φαίνεται γρήγορα αν το πλάνο έχει χώρο για προπόνηση ή όχι.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {suggestionCards.map((item) => (
                <div key={item.label} className={ui?.summaryBox || "rounded-2xl border p-4"}>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={ui?.label || "text-sm font-semibold"}>{item.label}</h3>
                    <span className={ui?.badge || "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"}>{item.value}</span>
                  </div>
                  <p className={`mt-3 ${ui?.mutedText || "text-sm text-gray-600"}`}>{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="📆 Καταγραφή Πρόσληψης & Σύγκριση με Στόχους">
        {tdee !== null && (
          <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
            <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
              <div className="space-y-4">
                <div>
                  <label className={ui?.label || "block text-sm font-semibold mb-1"}>Καταγεγραμμένες Θερμίδες (kcal)</label>
                  <input
                    type="number"
                    placeholder="π.χ. 1850"
                    className={ui?.input || inputStyle}
                    style={forcedFieldStyle}
                    value={intakeKcal}
                    onChange={(e) => setIntakeKcal(e.target.value)}
                  />
                </div>

                <div>
                  <label className={ui?.label || "block text-sm font-semibold mb-1"}>Macros (π.χ. 140/50/200)</label>
                  <input
                    type="text"
                    placeholder="πρωτεΐνη/λίπος/υδατάνθρακες σε g"
                    className={ui?.input || inputStyle}
                    style={forcedFieldStyle}
                    value={macrosText}
                    onChange={(e) => setMacrosText(e.target.value)}
                  />
                  <p className={`mt-2 ${ui?.helper || "text-xs text-gray-500"}`}>
                    Γράψε τα macros σε μορφή <strong>P/F/C</strong>. Όχι ελεύθερο ποίημα, γιατί μετά ο parser θα σε κοιτάει παγωμένος.
                  </p>
                </div>
              </div>
            </div>

            <div className={statusTone || "rounded-2xl border p-4"}>
              <div className="space-y-3">
                <div>
                  <h3 className={ui?.label || "text-sm font-semibold"}>Άμεση ανάγνωση</h3>
                  <p className={ui?.mutedText || "text-sm text-gray-600"}>
                    Γρήγορη εικόνα για το πόσο κοντά ή μακριά είσαι από τους στόχους σου.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className={ui?.metricCard || "rounded-2xl border p-4"}>
                    <p className={ui?.helper || "text-xs text-gray-500"}>Διαφορά θερμίδων</p>
                    <p className="mt-2 text-2xl font-bold">
                      {intakeDelta == null ? "—" : `${intakeDelta > 0 ? "+" : ""}${intakeDelta} kcal`}
                    </p>
                    <p className={ui?.mutedText || "text-sm text-gray-600"}>
                      {intakeDelta == null
                        ? "Βάλε intake για να γίνει η σύγκριση. Χωρίς δεδομένα δεν υπάρχει διάγνωση."
                        : Math.abs(intakeDelta) <= 150
                        ? "Κοντά στον στόχο. Αυτό είναι έλεγχος, όχι χάος."
                        : intakeDelta > 0
                        ? "Πάνω από τον στόχο. Αν είσαι σε cut, εδώ αρχίζει η ζημιά."
                        : "Κάτω από τον στόχο. Χρήσιμο σε cut, όχι τόσο αθώο αν θες απόδοση."}
                    </p>
                  </div>

                  <div className={ui?.metricCard || "rounded-2xl border p-4"}>
                    <p className={ui?.helper || "text-xs text-gray-500"}>Καταγεγραμμένα macros</p>
                    <p className="mt-2 text-lg font-bold">
                      {actualIntakeMacros.protein.toFixed(0)} / {actualIntakeMacros.fat.toFixed(0)} / {actualIntakeMacros.carbs.toFixed(0)}
                    </p>
                    <p className={ui?.mutedText || "text-sm text-gray-600"}>P / F / C σε γραμμάρια από το intake log.</p>
                  </div>
                </div>

                <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <p className={ui?.helper || "text-xs text-gray-500"}>Πρωτεΐνη</p>
                      <p className="font-semibold">{macroDeltas.protein.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className={ui?.helper || "text-xs text-gray-500"}>Λίπος</p>
                      <p className="font-semibold">{macroDeltas.fat.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className={ui?.helper || "text-xs text-gray-500"}>Υδατάνθρακες</p>
                      <p className="font-semibold">{macroDeltas.carbs.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className={`mt-3 ${ui?.mutedText || "text-sm text-gray-600"}`}>
                    {Math.abs(macroDeltas.protein) > 10 && <p>⚠️ Πρωτεΐνη: {macroDeltas.protein.toFixed(1)}% απόκλιση από στόχο.</p>}
                    {Math.abs(macroDeltas.fat) > 10 && <p>⚠️ Λίπος: {macroDeltas.fat.toFixed(1)}% απόκλιση από στόχο.</p>}
                    {Math.abs(macroDeltas.carbs) > 10 && <p>⚠️ Υδατάνθρακες: {macroDeltas.carbs.toFixed(1)}% απόκλιση από στόχο.</p>}
                    {Math.abs(macroDeltas.protein) <= 10 && Math.abs(macroDeltas.fat) <= 10 && Math.abs(macroDeltas.carbs) <= 10 && (
                      <p>✅ Είσαι εντός ±10% σε όλα τα macros.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="📊 Σύνολο Πλάνου & Cloud Ενέργειες">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
            <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span className={ui?.badge || "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"}>🎯 {targetProtein.toFixed(1)}g P</span>
                  <span className={ui?.badge || "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"}>🥑 {targetFat.toFixed(1)}g F</span>
                  <span className={ui?.badge || "text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800"}>🍞 {targetCarbs.toFixed(1)}g C</span>
                </div>

                <p className={ui?.mutedText || "text-sm text-gray-600"}>
                  <strong>Πλάνο:</strong> {num(totalMacros?.protein).toFixed(1)}g P / {num(totalMacros?.fat).toFixed(1)}g F / {num(totalMacros?.carbs).toFixed(1)}g C
                </p>
                <p className={ui?.mutedText || "text-sm text-gray-600"}>
                  <strong>Διαφορά:</strong> {(num(totalMacros?.protein) - targetProtein).toFixed(1)} P / {(num(totalMacros?.fat) - targetFat).toFixed(1)} F / {(num(totalMacros?.carbs) - targetCarbs).toFixed(1)} C
                </p>
                <p className="text-base font-bold">🔥 Θερμίδες από το πλάνο: {planKcal} kcal</p>
              </div>
            </div>

            <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={saveMealsToSupabase}
                  disabled={!userId}
                  className={`${ui?.successButton || "bg-green-600 text-white px-4 py-2 rounded"} disabled:cursor-not-allowed disabled:opacity-50`}
                  title={userId ? "Αποθήκευση των γευμάτων στο cloud" : "Συνδέσου για cloud αποθήκευση"}
                >
                  ☁️ Αποθήκευση Γευμάτων
                </button>
                <button
                  onClick={loadMealsFromSupabase}
                  disabled={!userId}
                  className={`${ui?.primaryButton || "bg-blue-600 text-white px-4 py-2 rounded"} disabled:cursor-not-allowed disabled:opacity-50`}
                  title={userId ? "Φόρτωση γευμάτων από το cloud" : "Συνδέσου για cloud φόρτωση"}
                >
                  🔄 Φόρτωση Γευμάτων
                </button>
                <button
                  onClick={savePlanToSupabase}
                  disabled={!userId}
                  className={`${ui?.successButton || "bg-green-600 text-white px-4 py-2 rounded"} disabled:cursor-not-allowed disabled:opacity-50`}
                  title={userId ? "Αποθήκευση πλάνου στον server" : "Συνδέσου για αποθήκευση"}
                >
                  💾 Αποθήκευση Πλάνου
                </button>
                <button
                  onClick={loadPlanFromSupabase}
                  disabled={!userId}
                  className={`${ui?.primaryButton || "bg-blue-600 text-white px-4 py-2 rounded"} disabled:cursor-not-allowed disabled:opacity-50`}
                  title={userId ? "Φόρτωση πλάνου από τον server" : "Συνδέσου για φόρτωση"}
                >
                  ☁️ Φόρτωση Πλάνου
                </button>
              </div>

              <p className={`mt-3 ${ui?.helper || "text-xs text-gray-500"}`}>
                Τα cloud actions είναι κλειδωμένα χωρίς login. Το app δεν διαβάζει τη σκέψη σου, όσο κι αν θα βόλευε.
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="👁️ Προεπισκόπηση Εβδομαδιαίου Πλάνου">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="space-y-4 text-sm">
            {daysOrder.map((day) => (
              <div key={day} className={ui?.summaryBox || "rounded-2xl border p-4"}>
                <h3 className="mb-3 text-base font-bold text-yellow-600 dark:text-yellow-300">📅 {day}</h3>
                <ul className="space-y-2">
                  {MEAL_TYPES.map(({ key, label }) => {
                    const mealName = customMeals?.[`${day}-${key}`] || "-";
                    return (
                      <li key={`${day}-${key}`} className="flex justify-between gap-3 border-b border-zinc-200 pb-2 last:border-b-0 dark:border-zinc-800">
                        <span>{label}</span>
                        <span className="text-right font-medium">{mealName}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className={ui?.metricCard || "rounded-2xl border p-4"}>
            <div className="space-y-3">
              <h3 className={ui?.label || "text-sm font-semibold"}>Σύνολο εβδομάδας</h3>
              <p className={ui?.mutedText || "text-sm text-gray-600"}>Μαζεμένη εικόνα του πλάνου χωρίς να κάνεις βόλτες από μέρα σε μέρα σαν χαμένος λογιστής macros.</p>

              <div className="grid gap-3">
                <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
                  <p className={ui?.helper || "text-xs text-gray-500"}>Πρωτεΐνη</p>
                  <p className="text-xl font-bold">{weeklyTotals.protein.toFixed(1)}g</p>
                </div>
                <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
                  <p className={ui?.helper || "text-xs text-gray-500"}>Λίπος</p>
                  <p className="text-xl font-bold">{weeklyTotals.fat.toFixed(1)}g</p>
                </div>
                <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
                  <p className={ui?.helper || "text-xs text-gray-500"}>Υδατάνθρακες</p>
                  <p className="text-xl font-bold">{weeklyTotals.carbs.toFixed(1)}g</p>
                </div>
                <div className={ui?.metricCard || "rounded-2xl border p-4"}>
                  <p className={ui?.helper || "text-xs text-gray-500"}>Θερμίδες</p>
                  <p className="text-2xl font-bold">{weeklyTotals.kcal.toFixed(0)} kcal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="📤 Export & Κοινοποίηση">
        <div className="flex flex-wrap gap-3">
          <button onClick={exportToPDF} className={ui?.secondaryButton || "bg-yellow-500 text-white px-4 py-2 rounded"}>📄 PDF</button>
          <button onClick={exportToCSV} className={ui?.primaryButton || "bg-blue-600 text-white px-4 py-2 rounded"}>📑 CSV</button>
          <button onClick={sharePlan} className={ui?.primaryButton || "bg-blue-600 text-white px-4 py-2 rounded"}>📤 Κοινοποίηση</button>
        </div>
      </CollapsibleSection>

      {intakeHistory.length > 0 && (
        <CollapsibleSection title="📈 Ιστορικό Θερμίδων">
          <div className={ui?.summaryBox || "rounded-2xl border p-4"}>
            <p className={`mb-4 ${ui?.mutedText || "text-sm text-gray-600"}`}>
              Η τάση εδώ είναι πιο χρήσιμη από ένα μεμονωμένο intake. Μία μέρα είναι θόρυβος, το μοτίβο είναι η αλήθεια.
            </p>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={intakeHistory} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                <defs>
                  <linearGradient id="kcalFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#27272a" : "#e5e7eb"} />
                <XAxis dataKey="date" stroke={theme === "dark" ? "#a1a1aa" : "#4b5563"} tick={{ fontSize: 12, dx: 0, dy: 6 }} />
                <YAxis stroke={theme === "dark" ? "#a1a1aa" : "#4b5563"} tick={{ fontSize: 12, dx: -4 }} />
                <Tooltip
                  contentStyle={{
                    background: theme === "dark" ? "#0b0b0c" : "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: theme === "dark" ? "0 6px 24px rgba(0,0,0,0.5)" : "0 6px 24px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ color: theme === "dark" ? "#e4e4e7" : "#111827" }}
                  formatter={(value) => [`${value} kcal`, "Θερμίδες"]}
                  cursor={{ stroke: theme === "dark" ? "#27272a" : "#e5e7eb", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="kcal"
                  stroke="#facc15"
                  strokeWidth={3}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                  fill="url(#kcalFill)"
                  fillOpacity={1}
                  animationDuration={400}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
