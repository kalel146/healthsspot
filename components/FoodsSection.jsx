import React, { useMemo } from "react";
import CollapsibleSection from "../CollapsibleSection";
import { useTheme } from "../ThemeContext";
import { toNum, fmtG, kcalOf } from "../utils/nutritionFormatters";

function sameFood(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.name === b.name &&
    Number(a.protein) === Number(b.protein) &&
    Number(a.fat) === Number(b.fat) &&
    Number(a.carbs) === Number(b.carbs)
  );
}

export default function FoodsSection({
  inputStyle,
  foodSearch,
  setFoodSearch,
  newFood,
  setNewFood,
  addCustomFood,
  selectedDay,
  setSelectedDay,
  selectedMealType,
  setSelectedMealType,
  daysOrder,
  foods,
  userFoods,
  setUserFoods,
  setCustomMeals,
  sectionStyle,
  borderCol,
  headBg,
  headText,
  cellText,
  rowAltBg,
  rowBg,
}) {
  const { theme } = useTheme();

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

  const baseBadgeClass =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border";
  const customBadgeClass =
    theme === "dark"
      ? `${baseBadgeClass} bg-emerald-500/10 text-emerald-300 border-emerald-500/30`
      : `${baseBadgeClass} bg-emerald-50 text-emerald-700 border-emerald-200`;
  const defaultBadgeClass =
    theme === "dark"
      ? `${baseBadgeClass} bg-zinc-800 text-zinc-300 border-zinc-700`
      : `${baseBadgeClass} bg-zinc-100 text-zinc-700 border-zinc-200`;
  const mutedTextClass = theme === "dark" ? "text-zinc-400" : "text-zinc-500";
  const helperBoxClass =
    theme === "dark"
      ? "rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300"
      : "rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600";
  const emptyStateClass =
    theme === "dark"
      ? "rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-5 text-center text-zinc-400"
      : "rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center text-zinc-500";

  const foodList = Array.isArray(foods) ? foods : [];
  const safeUserFoods = Array.isArray(userFoods) ? userFoods : [];
  const customCount = foodList.filter((item) => safeUserFoods.some((food) => sameFood(food, item))).length;
  const defaultCount = Math.max(foodList.length - customCount, 0);

  const syncMealsWithFoodRename = (prevName, nextName) => {
    if (!prevName || !nextName || prevName === nextName) return;
    setCustomMeals((prev) => {
      const nextMeals = { ...prev };
      Object.entries(nextMeals).forEach(([key, value]) => {
        if (value === prevName) nextMeals[key] = nextName;
      });
      return nextMeals;
    });
  };

  const removeFoodFromPlan = (foodName) => {
    if (!foodName) return;
    setCustomMeals((prev) => {
      const nextMeals = { ...prev };
      Object.entries(nextMeals).forEach(([key, value]) => {
        if (value === foodName) delete nextMeals[key];
      });
      return nextMeals;
    });
  };

  const updateFoodAtIndex = (index, nextFood, prevName) => {
    setUserFoods((prev) => prev.map((food, i) => (i === index ? nextFood : food)));
    syncMealsWithFoodRename(prevName, nextFood?.name);
  };

  const removeFoodAtIndex = (index, foodName) => {
    setUserFoods((prev) => prev.filter((_, i) => i !== index));
    removeFoodFromPlan(foodName);
  };

  return (
    <div className="space-y-4">
          <CollapsibleSection title="🍽️ Προσθήκη Τροφίμων">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Αναζήτησε τρόφιμο..."
                className={`p-2 w-full rounded ${inputStyle}`}
                style={forcedFieldStyle}
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
              />

              <div className={helperBoxClass}>
                Η αναζήτηση φιλτράρει πλέον όλη τη βάση που βλέπεις εδώ: default τρόφιμα και δικά σου custom.
              </div>

              <div className="grid gap-2 text-xs md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
                <input
                  placeholder="Όνομα"
                  className={inputStyle}
                  style={forcedFieldStyle}
                  value={newFood.name}
                  onChange={(e) => setNewFood((s) => ({ ...s, name: e.target.value }))}
                />
                <input
                  placeholder="P"
                  className={inputStyle}
                  style={forcedFieldStyle}
                  type="number"
                  value={newFood.protein}
                  onChange={(e) => setNewFood((s) => ({ ...s, protein: e.target.value }))}
                />
                <input
                  placeholder="F"
                  className={inputStyle}
                  style={forcedFieldStyle}
                  type="number"
                  value={newFood.fat}
                  onChange={(e) => setNewFood((s) => ({ ...s, fat: e.target.value }))}
                />
                <input
                  placeholder="C"
                  className={inputStyle}
                  style={forcedFieldStyle}
                  type="number"
                  value={newFood.carbs}
                  onChange={(e) => setNewFood((s) => ({ ...s, carbs: e.target.value }))}
                />
                <button
                  className="rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
                  onClick={addCustomFood}
                >
                  ➕ Προσθήκη
                </button>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="🗓️ Αντιστοίχιση Γευμάτων">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`p-2 rounded ${inputStyle}`}
                  style={forcedFieldStyle}
                >
                  {daysOrder.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value)}
                  className={`p-2 rounded ${inputStyle}`}
                  style={forcedFieldStyle}
                >
                  <option value="breakfast">Πρωινό</option>
                  <option value="lunch">Μεσημεριανό</option>
                  <option value="snack">Σνακ</option>
                  <option value="dinner">Βραδινό</option>
                </select>
              </div>

              <div className={helperBoxClass}>
                Ό,τι προσθέτεις από τη λίστα θα μπει στο <strong>{selectedDay}</strong> → <strong>{selectedMealType}</strong>.
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="📦 Λίστα Τροφίμων (user + default)">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={customBadgeClass}>Custom: {customCount}</span>
                  <span className={defaultBadgeClass}>Default: {defaultCount}</span>
                  <span className={mutedTextClass}>Σύνολο αποτελεσμάτων: {foodList.length}</span>
                </div>
                <div className={`text-sm ${mutedTextClass}`}>
                  Edit / delete επιτρέπεται μόνο στα custom τρόφιμα. Τα default δεν τα πειράζουμε. Δεν είναι χαρτοπετσέτες.
                </div>
              </div>

              <div className={`${sectionStyle} p-0 overflow-hidden`}>
                <table className={`w-full text-sm border ${borderCol}`}>
                  <thead className={`${headBg} ${headText} sticky top-0 z-10`}>
                    <tr>
                      <th className="p-2 text-left">Τρόφιμο</th>
                      <th className="p-2 text-right">Πρωτεΐνη</th>
                      <th className="p-2 text-right">Λίπος</th>
                      <th className="p-2 text-right">Υδατ.</th>
                      <th className="p-2 text-right">Ενέργεια</th>
                      <th className="p-2 text-center">Ενέργειες</th>
                    </tr>
                  </thead>

                  <tbody className={`${cellText}`}>
                    {foodList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4">
                          <div className={emptyStateClass}>
                            Δεν βρέθηκαν τρόφιμα για το search <strong>{foodSearch || "(κενό)"}</strong>.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      foodList.map((item, i) => {
                        const p = toNum(item.protein);
                        const f = toNum(item.fat);
                        const c = toNum(item.carbs);
                        const odd = i % 2 === 1;
                        const customIndex = safeUserFoods.findIndex((food) => sameFood(food, item));
                        const isCustom = customIndex !== -1;

                        return (
                          <tr key={`${isCustom ? "u" : "d"}-${item.name}-${i}`} className={`${odd ? rowAltBg : rowBg} border-t ${borderCol}`}>
                            <td className="p-2">
                              <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
                                <span className="font-medium">{item.name}</span>
                                <span className={isCustom ? customBadgeClass : defaultBadgeClass}>
                                  {isCustom ? "Custom" : "Default"}
                                </span>
                              </div>
                            </td>
                            <td className="p-2 text-right">{fmtG(p)}</td>
                            <td className="p-2 text-right">{fmtG(f)}</td>
                            <td className="p-2 text-right">{fmtG(c)}</td>
                            <td className="p-2 text-right">{kcalOf({ protein: p, fat: f, carbs: c })}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1 justify-center">
                                <button
                                  className="rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-black transition hover:bg-yellow-400"
                                  title="Προσθήκη στο Πλάνο"
                                  onClick={() => {
                                    const mealKey = `${selectedDay}-${selectedMealType}`;
                                    setCustomMeals((prev) => ({ ...prev, [mealKey]: item.name }));
                                  }}
                                >
                                  ➕ Στο Πλάνο
                                </button>

                                {isCustom ? (
                                  <>
                                    <button
                                      className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                                      title="Επεξεργασία Τροφίμου"
                                      onClick={() => {
                                        const newName = prompt("✏️ Νέο όνομα:", item.name);
                                        const newProtein = Number(prompt("Πρωτεΐνη (g):", p));
                                        const newFat = Number(prompt("Λίπος (g):", f));
                                        const newCarbs = Number(prompt("Υδατάνθρακες (g):", c));
                                        if (
                                          !newName?.trim() ||
                                          !Number.isFinite(newProtein) ||
                                          !Number.isFinite(newFat) ||
                                          !Number.isFinite(newCarbs)
                                        ) {
                                          return;
                                        }
                                        updateFoodAtIndex(
                                          customIndex,
                                          {
                                            name: newName.trim(),
                                            protein: Math.max(0, newProtein),
                                            fat: Math.max(0, newFat),
                                            carbs: Math.max(0, newCarbs),
                                          },
                                          item.name
                                        );
                                      }}
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button
                                      className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-600"
                                      title="Διαγραφή Τροφίμου"
                                      onClick={() => removeFoodAtIndex(customIndex, item.name)}
                                    >
                                      🗑️ Delete
                                    </button>
                                  </>
                                ) : (
                                  <span className={`px-2 py-1 text-xs ${mutedTextClass}`}>Read only</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleSection>
    </div>
  );
}
