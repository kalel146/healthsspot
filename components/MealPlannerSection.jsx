import React, { useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CollapsibleSection from "../CollapsibleSection";

const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"];

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "0.75rem",
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl" {...attributes} {...listeners}>
      {children}
    </div>
  );
}

const getFoodEnergy = (food, safeNum, round1) => {
  const explicit = Number(food?.kcal);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  return round1(
    safeNum(food?.protein) * 4 +
      safeNum(food?.fat) * 9 +
      safeNum(food?.carbs) * 4
  );
};

export default function MealPlannerSection({
  daysOrder,
  setDaysOrder,
  customMeals,
  setCustomMeals,
  allFoodsFull,
  handleReplacement,
  theme,
  protein,
  fat,
  carbs,
  weight,
  totalMacros,
  planKcal,
  safeNum,
  round1,
  ui,
}) {
  const forcedFieldStyle = useMemo(
    () => ({
      backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
      color: theme === "dark" ? "#f4f4f5" : "#18181b",
      WebkitTextFillColor: theme === "dark" ? "#f4f4f5" : "#18181b",
      caretColor: "#facc15",
      borderColor: theme === "dark" ? "#3f3f46" : "#d4d4d8",
    }),
    [theme]
  );

  const dayCardClass =
    theme === "dark"
      ? "rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 text-zinc-100 shadow-sm"
      : "rounded-2xl border border-zinc-200 bg-white/95 p-4 text-zinc-900 shadow-sm";

  const mealRowClass =
    theme === "dark"
      ? "rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-3"
      : "rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3";

  const badgeClass =
    theme === "dark"
      ? "inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-200"
      : "inline-flex items-center rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700";

  const summaryTone =
    theme === "dark"
      ? "rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm"
      : "rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm";

  const target = useMemo(
    () => ({
      protein: safeNum(protein) * safeNum(weight),
      fat: safeNum(fat) * safeNum(weight),
      carbs: safeNum(carbs),
    }),
    [protein, fat, carbs, weight, safeNum]
  );

  const foodMap = useMemo(() => {
    const map = new Map();
    (Array.isArray(allFoodsFull) ? allFoodsFull : []).forEach((food) => {
      if (food?.name) map.set(food.name, food);
    });
    return map;
  }, [allFoodsFull]);

  const daySummaries = useMemo(() => {
    const result = {};

    (Array.isArray(daysOrder) ? daysOrder : []).forEach((day) => {
      const summary = {
        protein: 0,
        fat: 0,
        carbs: 0,
        kcal: 0,
        filledMeals: 0,
      };

      MEAL_TYPES.forEach((mealType) => {
        const mealKey = `${day}-${mealType}`;
        const mealName = customMeals?.[mealKey] || "";
        const food = foodMap.get(mealName);

        if (mealName) summary.filledMeals += 1;

        if (food) {
          summary.protein += safeNum(food.protein);
          summary.fat += safeNum(food.fat);
          summary.carbs += safeNum(food.carbs);
          summary.kcal += getFoodEnergy(food, safeNum, round1);
        }
      });

      result[day] = {
        protein: round1(summary.protein),
        fat: round1(summary.fat),
        carbs: round1(summary.carbs),
        kcal: Math.round(summary.kcal),
        filledMeals: summary.filledMeals,
      };
    });

    return result;
  }, [daysOrder, customMeals, foodMap, safeNum, round1]);

  const weeklyTarget = useMemo(
    () => ({
      protein: round1(target.protein * (daysOrder?.length || 0)),
      fat: round1(target.fat * (daysOrder?.length || 0)),
      carbs: round1(target.carbs * (daysOrder?.length || 0)),
      kcal: null,
    }),
    [target, daysOrder]
  );

  const weeklyDelta = useMemo(
    () => ({
      protein: round1(safeNum(totalMacros?.protein) - weeklyTarget.protein),
      fat: round1(safeNum(totalMacros?.fat) - weeklyTarget.fat),
      carbs: round1(safeNum(totalMacros?.carbs) - weeklyTarget.carbs),
    }),
    [totalMacros, weeklyTarget, safeNum, round1]
  );

  return (
    <CollapsibleSection title="🍲 Προγραμματισμός Γευμάτων ανά Ημέρα">
      <div className="space-y-4">
        <div className={ui?.summaryBox || summaryTone}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className={ui?.label}>Weekly meal flow</h3>
              <p className={ui?.mutedText}>
                Σύρε τις ημέρες για να αλλάξεις σειρά. Κάθε αλλαγή μένει στο local
                persistence, οπότε δεν χάνεται με ένα refresh σαν να μην έγινε ποτέ.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={ui?.badge}>🎯 {weeklyTarget.protein.toFixed(1)}g P / εβδομάδα</span>
              <span className={ui?.badge}>🥑 {weeklyTarget.fat.toFixed(1)}g F / εβδομάδα</span>
              <span className={ui?.badge}>🍞 {weeklyTarget.carbs.toFixed(1)}g C / εβδομάδα</span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className={ui?.metricCard || summaryTone}>
              <p className={ui?.helper}>Weekly totals</p>
              <p className="mt-1 font-semibold">
                {safeNum(totalMacros?.protein).toFixed(1)}g P ·{" "}
                {safeNum(totalMacros?.fat).toFixed(1)}g F ·{" "}
                {safeNum(totalMacros?.carbs).toFixed(1)}g C
              </p>
            </div>

            <div className={ui?.metricCard || summaryTone}>
              <p className={ui?.helper}>Weekly delta</p>
              <p className="mt-1 font-semibold">
                {weeklyDelta.protein.toFixed(1)} P / {weeklyDelta.fat.toFixed(1)} F /{" "}
                {weeklyDelta.carbs.toFixed(1)} C
              </p>
            </div>

            <div className={ui?.metricCard || summaryTone}>
              <p className={ui?.helper}>Weekly kcal</p>
              <p className="mt-1 font-semibold">🔥 {planKcal} kcal</p>
            </div>

            <div className={ui?.metricCard || summaryTone}>
              <p className={ui?.helper}>Filled meals</p>
              <p className="mt-1 font-semibold">
                {Object.values(customMeals || {}).filter(Boolean).length} / {(daysOrder?.length || 0) * 4}
              </p>
            </div>
          </div>
        </div>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;

            setDaysOrder((items) => {
              const oldIndex = items.indexOf(active.id);
              const newIndex = items.indexOf(over.id);
              if (oldIndex === -1 || newIndex === -1) return items;
              return arrayMove(items, oldIndex, newIndex);
            });
          }}
        >
          <SortableContext items={daysOrder} strategy={verticalListSortingStrategy}>
            {daysOrder.map((day) => {
              const daySummary = daySummaries[day] || {
                protein: 0,
                fat: 0,
                carbs: 0,
                kcal: 0,
                filledMeals: 0,
              };

              const dayDelta = {
                protein: round1(daySummary.protein - target.protein),
                fat: round1(daySummary.fat - target.fat),
                carbs: round1(daySummary.carbs - target.carbs),
              };

              return (
                <SortableItem key={day} id={day}>
                  <div className={dayCardClass}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="font-bold text-yellow-400">📅 {day}</p>
                      <span className={ui?.helper}>drag & drop σειράς</span>
                    </div>

                    <ul className="space-y-3">
                      {MEAL_TYPES.map((mealType) => {
                        const emoji =
                          mealType === "breakfast"
                            ? "🍽️"
                            : mealType === "lunch"
                            ? "🥗"
                            : mealType === "snack"
                            ? "🥚"
                            : "🍝";

                        const label =
                          mealType === "breakfast"
                            ? "Πρωινό"
                            : mealType === "lunch"
                            ? "Μεσημεριανό"
                            : mealType === "snack"
                            ? "Σνακ"
                            : "Βραδινό";

                        const mealKey = `${day}-${mealType}`;
                        const mealName = customMeals[mealKey] || "";
                        const food = foodMap.get(mealName);

                        const p = Number(food?.protein) || 0;
                        const f = Number(food?.fat) || 0;
                        const c = Number(food?.carbs) || 0;
                        const kcal = food ? getFoodEnergy(food, safeNum, round1) : 0;

                        return (
                          <li key={mealKey} className={mealRowClass}>
                            <div className="mb-2 text-sm font-semibold">
                              {emoji} {label}
                            </div>

                            <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
                              <input
                                title="Εισαγωγή ή τροποποίηση γεύματος"
                                className={`${ui?.input} flex-1 text-sm`}
                                style={forcedFieldStyle}
                                value={mealName}
                                onChange={(e) =>
                                  setCustomMeals((prev) => ({
                                    ...prev,
                                    [mealKey]: e.target.value,
                                  }))
                                }
                                placeholder="Πληκτρολόγησε γεύμα ή πάτα Αντικατάσταση"
                              />

                              <button
                                className={`${ui?.primaryButton} shrink-0 text-sm`}
                                title="Αυτόματη αντικατάσταση από βάση"
                                onClick={() => handleReplacement(day, mealType)}
                              >
                                🔁 Αντικατάσταση
                              </button>

                              <div className={`${badgeClass} xl:ml-auto`} title="Μακροθρεπτικά του γεύματος">
                                {mealName && (p || f || c)
                                  ? `📊 ${p}g P / ${f}g F / ${c}g C · ${kcal} kcal`
                                  : "📊 —"}
                              </div>
                            </div>

                            {mealType === "dinner" && (
                              <div className={`mt-3 ${summaryTone}`}>
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div>
                                    <p className={ui?.helper}>Στόχος ημέρας</p>
                                    <p className="mt-1 font-semibold">
                                      {target.protein.toFixed(1)}g P · {target.fat.toFixed(1)}g F ·{" "}
                                      {target.carbs.toFixed(1)}g C
                                    </p>
                                  </div>

                                  <div>
                                    <p className={ui?.helper}>Σύνολο ημέρας</p>
                                    <p className="mt-1 font-semibold">
                                      {daySummary.protein.toFixed(1)}g P · {daySummary.fat.toFixed(1)}g F ·{" "}
                                      {daySummary.carbs.toFixed(1)}g C
                                    </p>
                                  </div>
                                </div>

                                <p className={`mt-3 ${ui?.mutedText}`}>
                                  ✏️ Ημερήσια διαφορά: {dayDelta.protein.toFixed(1)} P /{" "}
                                  {dayDelta.fat.toFixed(1)} F / {dayDelta.carbs.toFixed(1)} C
                                </p>

                                <p className="mt-2 text-base font-bold">
                                  🔥 Θερμίδες ημέρας: {daySummary.kcal} kcal
                                </p>

                                <p className={`mt-1 text-sm ${ui?.mutedText}`}>
                                  Συμπληρωμένα γεύματα: {daySummary.filledMeals}/4
                                </p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </SortableItem>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </CollapsibleSection>
  );
}