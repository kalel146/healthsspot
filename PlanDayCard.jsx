// PlanDayCard.jsx
import React from "react";
import { useTheme } from "./ThemeContext";

export default function PlanDayCard({ day, customMeals = {}, allFoods = [] }) {
  const { theme } = useTheme();

  const panel =
    theme === "dark"
      ? "bg-zinc-900/95 border border-zinc-800 text-zinc-100"
      : "bg-white/95 border border-zinc-200 text-zinc-900";

  const rowBg = theme === "dark" ? "bg-zinc-950" : "bg-zinc-50";
  const sub = theme === "dark" ? "text-zinc-400" : "text-zinc-600";

  const meals = ["breakfast", "lunch", "snack", "dinner"];

  const pretty = (t) =>
    t === "breakfast"
      ? "🍽️ Πρωινό"
      : t === "lunch"
      ? "🥗 Μεσημεριανό"
      : t === "snack"
      ? "🥚 Σνακ"
      : "🍝 Βραδινό";

  const name = (type) => customMeals[`${day}-${type}`] || "-";
  const macros = (type) => {
    const f = allFoods.find((x) => x.name === name(type));
    if (!f) return null;
    const p = Number(f.protein) || 0;
    const fat = Number(f.fat) || 0;
    const c = Number(f.carbs) || 0;
    return { p, fat, c, kcal: p * 4 + fat * 9 + c * 4 };
  };

  return (
    <div className={`rounded-2xl p-4 ${panel}`}>
      <h3 className="font-bold text-yellow-400 mb-3">📅 {day}</h3>
      <ul className="space-y-2">
        {meals.map((m, i) => {
          const mdata = macros(m);
          return (
            <li
              key={m}
              className={`rounded-lg px-3 py-2 ${
                i % 2 ? rowBg : ""
              } flex items-start justify-between gap-3`}
            >
              <div className="min-w-0">
                <div className="font-medium">{pretty(m)}</div>
                <div className={`truncate ${sub}`}>{name(m)}</div>
              </div>
              {mdata && (
                <div className="text-right text-xs">
                  <div className={sub}>
                    {mdata.p}g P · {mdata.fat}g F · {mdata.c}g C
                  </div>
                  <div className="font-semibold">{Math.round(mdata.kcal)} kcal</div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
