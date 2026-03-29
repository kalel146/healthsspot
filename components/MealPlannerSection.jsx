import React from "react";
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
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "0.5rem",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl"
      {...attributes}
      {...listeners}
    >
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
}) {
  const dayCardClass =
    theme === "dark"
      ? "bg-zinc-900 border border-zinc-700 text-zinc-100 shadow-sm"
      : "bg-white border border-zinc-200 text-zinc-900 shadow-sm";

  const mealRowClass =
    theme === "dark"
      ? "bg-zinc-950/70 border border-zinc-800"
      : "bg-zinc-50 border border-zinc-200";

  const badgeClass =
    theme === "dark"
      ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
      : "bg-white text-zinc-700 border border-zinc-300";

  const summaryBoxClass =
    theme === "dark"
      ? "bg-zinc-950 border border-zinc-700 text-zinc-100"
      : "bg-zinc-50 border border-zinc-200 text-zinc-900";

  const forcedInputStyle =
    theme === "dark"
      ? {
          backgroundColor: "#18181b",
          color: "#f4f4f5",
          WebkitTextFillColor: "#f4f4f5",
          caretColor: "#facc15",
          borderColor: "#3f3f46",
        }
      : {
          backgroundColor: "#ffffff",
          color: "#18181b",
          WebkitTextFillColor: "#18181b",
          caretColor: "#facc15",
          borderColor: "#d4d4d8",
        };

  return (
    <CollapsibleSection title="🍲 Προγραμματισμός Γευμάτων ανά Ημέρα">
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
        <SortableContext
          items={daysOrder}
          strategy={verticalListSortingStrategy}
        >
          {daysOrder.map((day) => (
            <SortableItem key={day} id={day}>
              <div className={`rounded-2xl p-4 ${dayCardClass}`}>
                <p className="font-bold text-yellow-400 mb-3">📅 {day}</p>

                <ul className="space-y-3">
                  {["breakfast", "lunch", "snack", "dinner"].map(
                    (mealType) => {
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

                      const target = {
                        protein: safeNum(protein) * safeNum(weight),
                        fat: safeNum(fat) * safeNum(weight),
                        carbs: safeNum(carbs),
                      };

                      const delta = {
                        protein: round1(
                          safeNum(totalMacros.protein) - target.protein
                        ),
                        fat: round1(safeNum(totalMacros.fat) - target.fat),
                        carbs: round1(safeNum(totalMacros.carbs) - target.carbs),
                      };

                      return (
                        <li
                          key={mealKey}
                          className={`rounded-xl px-3 py-3 ${mealRowClass}`}
                        >
                          <div className="text-sm font-semibold mb-2">
                            {emoji} {label}
                          </div>

                          <div className="flex gap-2 items-start">
                            <input
                              title="Εισαγωγή ή τροποποίηση γεύματος"
                              className={`flex-1 text-sm rounded px-3 py-2 border shadow-sm ${
                                theme === "dark"
                                  ? "border-zinc-700 placeholder-zinc-500"
                                  : "border-zinc-300 placeholder-zinc-400"
                              }`}
                              style={forcedInputStyle}
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
                              className="shrink-0 text-xs bg-blue-600 text-white px-2 py-2 rounded hover:bg-blue-700 transition"
                              title="Αυτόματη αντικατάσταση από βάση"
                              onClick={() => handleReplacement(day, mealType)}
                            >
                              🔁 Αντικατάσταση
                            </button>

                            {mealName && (p || f || c) ? (
                              <div
                                className={`ml-auto text-xs rounded px-2 py-2 whitespace-nowrap ${badgeClass}`}
                                title="Μακροθρεπτικά του γεύματος"
                              >
                                📊 {p}g P / {f}g F / {c}g C
                              </div>
                            ) : (
                              <div
                                className={`ml-auto text-xs rounded px-2 py-2 whitespace-nowrap opacity-60 ${badgeClass}`}
                              >
                                📊 —
                              </div>
                            )}
                          </div>

                          {mealType === "dinner" && (
                            <div className={`mt-3 rounded-xl px-3 py-3 ${summaryBoxClass}`}>
                              <div className="text-sm space-y-1">
                                <p>
                                  🎯 Στόχος: {target.protein.toFixed(1)}g P,{" "}
                                  {target.fat.toFixed(1)}g F,{" "}
                                  {target.carbs.toFixed(1)}g C
                                </p>

                                <p>
                                  📦 Πλάνο: {totalMacros.protein.toFixed(1)}g P /{" "}
                                  {totalMacros.fat.toFixed(1)}g F /{" "}
                                  {totalMacros.carbs.toFixed(1)}g C
                                </p>

                                <p
                                  className={
                                    theme === "dark"
                                      ? "text-yellow-300"
                                      : "text-yellow-700"
                                  }
                                >
                                  ✏️ Διαφορά: {delta.protein.toFixed(1)} P /{" "}
                                  {delta.fat.toFixed(1)} F /{" "}
                                  {delta.carbs.toFixed(1)} C
                                </p>
                              </div>

                              <p
                                className={
                                  theme === "dark"
                                    ? "text-yellow-300 mt-2"
                                    : "text-yellow-700 mt-2"
                                }
                              >
                                🔥 Θερμίδες από το πλάνο: {planKcal} kcal
                              </p>
                            </div>
                          )}
                        </li>
                      );
                    }
                  )}
                </ul>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </CollapsibleSection>
  );
}