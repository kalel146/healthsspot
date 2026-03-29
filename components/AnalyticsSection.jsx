import React from "react";
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
import { Tabs, Tab } from "../TabsComponent";

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
}) {
  return (
    <>
      <CollapsibleSection title="📊 AI Προτάσεις">
        {tdee !== null && (
          <div className="space-y-4 text-sm">
            <p>⚡ <strong>Συνολικές θερμίδες:</strong> {tdee} kcal</p>
            <p>🍗 <strong>Πρωτεΐνη:</strong> {(protein * weight).toFixed(0)}g — {protein >= 2 ? "υψηλή, ιδανική για μυϊκή ανάπτυξη." : "φυσιολογική ή χαμηλή."}</p>
            <p>🧈 <strong>Λίπος:</strong> {(fat * weight).toFixed(0)}g — {fat < 0.6 ? "χαμηλό, πρόσεξε." : "ok."}</p>
            <p>🍞 <strong>Υδατάνθρακες:</strong> {Number(carbs || 0).toFixed(0)}g — ανάλογα με στόχο/προπόνηση.</p>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="📈 Προτάσεις Ανά Στόχο">
        {tdee !== null && (
          <div className="space-y-3 text-sm">
            <p>🎯 <strong>Cut:</strong> ~15-25% έλλειμμα → {(tdee * 0.75).toFixed(0)} kcal</p>
            <p>⚖️ <strong>Maintain:</strong> TDEE → {tdee} kcal</p>
            <p>💪 <strong>Bulk:</strong> ~10-15% surplus → {(tdee * 1.15).toFixed(0)} kcal</p>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="📆 Καταγραφή Πρόσληψης & Σύγκριση με Στόχους">
        {tdee && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Καταγεγραμμένες Θερμίδες (kcal):</label>
              <input
                type="number"
                placeholder="π.χ. 1850"
                className={inputStyle}
                value={intakeKcal}
                onChange={(e) => setIntakeKcal(e.target.value)}
                onBlur={() => {
                  const intake = parseInt(intakeKcal, 10);
                  if (!Number.isNaN(intake)) {
                    const diff = intake - tdee;
                    alert(`Διαφορά από στόχο: ${diff > 0 ? "+" : ""}${diff} kcal`);
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Macros (π.χ. 140/50/200):</label>
              <input
                type="text"
                placeholder="πρωτεΐνη/λίπος/υδατάνθρακες σε g"
                className={inputStyle}
                value={macrosText}
                onChange={(e) => setMacrosText(e.target.value)}
              />
            </div>

            {(() => {
              const [pStr, fStr, cStr] = (macrosText || "").split("/");
              const actuals = {
                protein: parseFloat(pStr) || 0,
                fat: parseFloat(fStr) || 0,
                carbs: parseFloat(cStr) || 0,
              };
              const targetProtein = protein * weight;
              const targetFat = fat * weight;
              const targetCarbs = Number(carbs || 0);

              const deltas = {
                protein: targetProtein ? ((actuals.protein - targetProtein) / targetProtein) * 100 : 0,
                fat: targetFat ? ((actuals.fat - targetFat) / targetFat) * 100 : 0,
                carbs: targetCarbs ? ((actuals.carbs - targetCarbs) / targetCarbs) * 100 : 0,
              };

              return (
                <div className="mt-4 p-4 rounded bg-white dark:bg-gray-800 border border-yellow-300 text-sm text-yellow-800 dark:text-yellow-200 font-mono">
                  {Math.abs(deltas.protein) > 10 && <p>⚠️ Πρωτεΐνη: {deltas.protein.toFixed(1)}% απόκλιση από στόχο.</p>}
                  {Math.abs(deltas.fat) > 10 && <p>⚠️ Λίπος: {deltas.fat.toFixed(1)}% απόκλιση από στόχο.</p>}
                  {Math.abs(deltas.carbs) > 10 && <p>⚠️ Υδατάνθρακες: {deltas.carbs.toFixed(1)}% απόκλιση από στόχο.</p>}
                  {Math.abs(deltas.protein) <= 10 && Math.abs(deltas.fat) <= 10 && Math.abs(deltas.carbs) <= 10 && <p>✅ Είσαι εντός ±10% σε όλα τα macros.</p>}
                </div>
              );
            })()}
          </div>
        )}
      </CollapsibleSection>

      <Tabs defaultTab="Σύνολο">
        <Tab label="📊 Σύνολο">
          <CollapsibleSection title="📊 Σύνολο Μακροθρεπτικών από Πλάνο">
            {(() => {
              const target = {
                protein: protein * weight,
                fat: fat * weight,
                carbs: Number(carbs || 0),
              };
              const actual = totalMacros;
              const delta = {
                protein: actual.protein - target.protein,
                fat: actual.fat - target.fat,
                carbs: actual.carbs - target.carbs,
              };
              return (
                <>
                  <div className="text-sm space-y-2">
                    <p>🎯 Στόχος: {target.protein.toFixed(1)}g πρωτεΐνη, {target.fat.toFixed(1)}g λίπος, {target.carbs.toFixed(1)}g υδατάνθρακες</p>
                    <p>📦 Πλάνο: {actual.protein.toFixed(1)}g P / {actual.fat.toFixed(1)}g F / {actual.carbs.toFixed(1)}g C</p>
                    <p className="text-yellow-700 dark:text-yellow-300">✏️ Διαφορά: {delta.protein.toFixed(1)} P / {delta.fat.toFixed(1)} F / {delta.carbs.toFixed(1)} C</p>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300">🔥 Θερμίδες από το πλάνο: {planKcal} kcal</p>
                </>
              );
            })()}
          </CollapsibleSection>

          <div className="flex flex-wrap gap-4 mt-4 sticky top-0 z-10 bg-opacity-80 backdrop-blur border-b py-2 px-2">
            <button onClick={saveMealsToSupabase} disabled={!userId} className="bg-green-500 px-3 py-1 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed" title={userId ? "Αποθήκευση των γευμάτων στο cloud" : "Συνδέσου για cloud αποθήκευση"}>☁️ Αποθήκευση στο Cloud</button>
            <button onClick={loadMealsFromSupabase} disabled={!userId} className="bg-blue-500 px-3 py-1 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed" title={userId ? "Φόρτωση γευμάτων από το cloud" : "Συνδέσου για cloud φόρτωση"}>🔄 Φόρτωση από Cloud</button>
            <button onClick={savePlanToSupabase} disabled={!userId} className="bg-green-600 text-white px-4 py-2 rounded ml-auto shadow-sm hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed" title={userId ? "Αποθήκευση πλάνου στον server" : "Συνδέσου για αποθήκευση"}>💾 Αποθήκευση</button>
            <button onClick={loadPlanFromSupabase} disabled={!userId} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed" title={userId ? "Φόρτωση πλάνου από τον server" : "Συνδέσου για φόρτωση"}>☁️ Φόρτωση</button>
          </div>

          <CollapsibleSection title="👁️ Προεπισκόπηση Εβδομαδιαίου Πλάνου">
            <div className="space-y-4 text-sm">
              {daysOrder.map((day) => (
                <div key={day} className="p-4 border border-yellow-300 rounded">
                  <h3 className="font-bold text-yellow-600 dark:text-yellow-300 mb-2">📅 {day}</h3>
                  <ul className="space-y-1">
                    {["breakfast", "lunch", "snack", "dinner"].map((mealType) => {
                      const mealName = customMeals[`${day}-${mealType}`] || "-";
                      return (
                        <li key={`${day}-${mealType}`} className="flex justify-between border-b dark:border-gray-700 pb-1">
                          <span className="capitalize">
                            {mealType === "breakfast" && "🍽️ Πρωινό:"}
                            {mealType === "lunch" && "🥗 Μεσημεριανό:"}
                            {mealType === "snack" && "🥚 Σνακ:"}
                            {mealType === "dinner" && "🍝 Βραδινό:"}
                          </span>
                          <span className="text-right font-medium text-gray-700 dark:text-gray-200">{mealName}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="📊 Σύνολο Πλάνου (ανά εβδομάδα)">
            {(() => {
              const total = daysOrder.reduce(
                (acc, day) => {
                  ["breakfast", "lunch", "snack", "dinner"].forEach((meal) => {
                    const mealName = customMeals[`${day}-${meal}`];
                    const food = allFoodsFull.find((f) => f.name === mealName);
                    if (food) {
                      acc.protein += Number(food.protein) || 0;
                      acc.fat += Number(food.fat) || 0;
                      acc.carbs += Number(food.carbs) || 0;
                    }
                  });
                  return acc;
                },
                { protein: 0, fat: 0, carbs: 0 }
              );

              const totalKcal = total.protein * 4 + total.carbs * 4 + total.fat * 9;

              return (
                <div className="text-sm space-y-2 bg-yellow-50 dark:bg-gray-800 p-4 rounded">
                  <p>🍽️ Πρωτεΐνη: {total.protein.toFixed(1)}g</p>
                  <p>🥑 Λίπος: {total.fat.toFixed(1)}g</p>
                  <p>🥔 Υδατάνθρακες: {total.carbs.toFixed(1)}g</p>
                  <p className="font-bold">🔥 Θερμίδες: {totalKcal.toFixed(0)} kcal</p>
                </div>
              );
            })()}
          </CollapsibleSection>
        </Tab>
      </Tabs>

      <CollapsibleSection title="📤 Κατέβασε Πλάνο">
        <div className="flex flex-wrap gap-2 mt-2 text-sm">
          <button onClick={exportToPDF} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">📄 PDF</button>
          <button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">📑 CSV</button>
          <button onClick={sharePlan} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">📤 Κοινοποίηση</button>
        </div>
      </CollapsibleSection>

      {intakeHistory.length > 0 && (
        <CollapsibleSection title="📈 Ιστορικό Θερμίδων">
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
                formatter={(v) => [`${v} kcal`, "Θερμίδες"]}
                cursor={{ stroke: theme === "dark" ? "#27272a" : "#e5e7eb", strokeWidth: 1 }}
              />
              <Line type="monotone" dataKey="kcal" stroke="#facc15" strokeWidth={3} dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5 }} fill="url(#kcalFill)" fillOpacity={1} animationDuration={400} animationEasing="ease-in-out" />
            </LineChart>
          </ResponsiveContainer>
        </CollapsibleSection>
      )}
    </>
  );
}
