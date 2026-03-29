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

  const target = {
    protein: safeNum(protein) * safeNum(weight),
    fat: safeNum(fat) * safeNum(weight),
    carbs: safeNum(carbs),
  };

  const delta = {
    protein: round1(safeNum(totalMacros.protein) - target.protein),
    fat: round1(safeNum(totalMacros.fat) - target.fat),
    carbs: round1(safeNum(totalMacros.carbs) - target.carbs),
  };

  return (
    <CollapsibleSection title="🍲 Προγραμματισμός Γευμάτων ανά Ημέρα">
      <div className="space-y-4">
        <div className={ui?.summaryBox || summaryTone}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className={ui?.label}>Weekly meal flow</h3>
              <p className={ui?.mutedText}>
                Σύρε τις ημέρες για να αλλάξεις σειρά. Κάθε αλλαγή μένει στο local persistence, οπότε δεν χάνεται με ένα refresh σαν να μην έγινε ποτέ.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={ui?.badge}>🎯 {target.protein.toFixed(1)}g P</span>
              <span className={ui?.badge}>🥑 {target.fat.toFixed(1)}g F</span>
              <span className={ui?.badge}>🍞 {target.carbs.toFixed(1)}g C</span>
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
            {daysOrder.map((day) => (
              <SortableItem key={day} id={day}>
                <div className={dayCardClass}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-bold text-yellow-400">📅 {day}</p>
                    <span className={ui?.helper}>drag & drop σειράς</span>
                  </div>

                  <ul className="space-y-3">
                    {["breakfast", "lunch", "snack", "dinner"].map((mealType) => {
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
                      const food = allFoodsFull.find((f) => f.name === mealName);

                      const p = Number(food?.protein) || 0;
                      const f = Number(food?.fat) || 0;
                      const c = Number(food?.carbs) || 0;

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
                              {mealName && (p || f || c) ? `📊 ${p}g P / ${f}g F / ${c}g C` : "📊 —"}
                            </div>
                          </div>

                          {mealType === "dinner" && (
                            <div className={`mt-3 ${summaryTone}`}>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className={ui?.helper}>Στόχος ημέρας</p>
                                  <p className="mt-1 font-semibold">
                                    {target.protein.toFixed(1)}g P · {target.fat.toFixed(1)}g F · {target.carbs.toFixed(1)}g C
                                  </p>
                                </div>
                                <div>
                                  <p className={ui?.helper}>Σύνολο πλάνου</p>
                                  <p className="mt-1 font-semibold">
                                    {totalMacros.protein.toFixed(1)}g P · {totalMacros.fat.toFixed(1)}g F · {totalMacros.carbs.toFixed(1)}g C
                                  </p>
                                </div>
                              </div>

                              <p className={`mt-3 ${ui?.mutedText}`}>
                                ✏️ Διαφορά: {delta.protein.toFixed(1)} P / {delta.fat.toFixed(1)} F / {delta.carbs.toFixed(1)} C
                              </p>
                              <p className="mt-2 text-base font-bold">🔥 Θερμίδες από το πλάνο: {planKcal} kcal</p>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </CollapsibleSection>
  );
}
