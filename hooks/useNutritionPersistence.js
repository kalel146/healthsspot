import { useEffect } from "react";

export const DEFAULT_DAYS_ORDER = [
  "Δευτέρα",
  "Τρίτη",
  "Τετάρτη",
  "Πέμπτη",
  "Παρασκευή",
  "Σάββατο",
  "Κυριακή",
];

export const readStoredNumber = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (raw === null || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const readStoredString = (key, fallback = "") => {
  const raw = localStorage.getItem(key);
  return raw ?? fallback;
};

export const readStoredJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export function useNutritionPersistence({
  protein,
  fat,
  carbs,
  preference,
  daysOrder,
  customMeals,
  userFoods,
}) {
  useEffect(() => {
    localStorage.setItem("userFoods", JSON.stringify(userFoods || []));
  }, [userFoods]);

  useEffect(() => {
    localStorage.setItem("protein", String(protein));
  }, [protein]);

  useEffect(() => {
    localStorage.setItem("fat", String(fat));
  }, [fat]);

  useEffect(() => {
    if (carbs !== null && carbs !== undefined && !Number.isNaN(carbs)) {
      localStorage.setItem("carbs", String(carbs));
    }
  }, [carbs]);

  useEffect(() => {
    localStorage.setItem("preference", preference);
  }, [preference]);

  useEffect(() => {
    localStorage.setItem("daysOrder", JSON.stringify(daysOrder || DEFAULT_DAYS_ORDER));
  }, [daysOrder]);

  useEffect(() => {
    localStorage.setItem("customMeals", JSON.stringify(customMeals || {}));
  }, [customMeals]);
}
