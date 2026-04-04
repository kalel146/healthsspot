import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser } from "@clerk/clerk-react";
import { useTheme } from "./ThemeContext";
import defaultMeals from "./defaultMeals.json";
import PlanDayCard from "./PlanDayCard";
import {
  safeNum,
  round1,
  calculateNutritionSummary,
  createFoodMap,
  getTotalMacrosFromMeals,
} from "./utils/nutritionCalculations";
import { getProteinLabel, getFatLabel } from "./utils/nutritionFormatters";
import { isValidFood, normalizeFood, canAddFood } from "./utils/nutritionValidation";
import {
  saveMealsToSupabase as saveMealsRequest,
  loadMealsFromSupabase as loadMealsRequest,
  savePlanToSupabase as savePlanRequest,
  loadPlanFromSupabase as loadPlanRequest,
} from "./services/nutritionSupabase";
import {
  useNutritionPersistence,
  DEFAULT_DAYS_ORDER,
  readStoredJson,
  readStoredNumber,
  readStoredString,
} from "./hooks/useNutritionPersistence";
import { useNutritionSync } from "./hooks/useNutritionSync";
import BmrTdeeSection from "./components/BmrTdeeSection";
import MacroGoalsSection from "./components/MacroGoalsSection";
import MealPlannerSection from "./components/MealPlannerSection";
import FoodsSection from "./components/FoodsSection";
import AnalyticsSection from "./components/AnalyticsSection";
import NutritionStatusBar from "./components/NutritionStatusBar";
import { getNutritionUiTokens } from "./utils/nutritionUiTokens";

const ANIMAL_REGEX =
  /(κοτόπουλ|κοτοπουλ|μοσχ|μοσχάρι|ψάρι|ψαρ|τόνο|τονο|σολομ|σολωμ|σαλμον|αυγ|αβγ|chicken|beef|fish|tuna|salmon|egg)/i;

const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"];

const MEAL_TARGET_RATIOS = {
  breakfast: { kcal: 0.25, protein: 0.24, fat: 0.22, carbs: 0.26 },
  lunch: { kcal: 0.3, protein: 0.31, fat: 0.28, carbs: 0.3 },
  snack: { kcal: 0.15, protein: 0.15, fat: 0.14, carbs: 0.14 },
  dinner: { kcal: 0.3, protein: 0.3, fat: 0.36, carbs: 0.3 },
};

const MEAL_TAG_PATTERNS = {
  breakfast: [/πρωιν/i, /breakfast/i],
  lunch: [/μεσημεριαν/i, /lunch/i],
  snack: [/σνακ/i, /snack/i, /γρήγορο/i, /post-workout/i, /post workout/i],
  dinner: [/βραδιν/i, /dinner/i],
};

const getFoodEnergy = (food) => {
  const explicit = Number(food?.kcal);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const derived =
    safeNum(food?.protein) * 4 + safeNum(food?.fat) * 9 + safeNum(food?.carbs) * 4;
  return round1(derived);
};

const normalizeFoodEntry = (food) => {
  const base = normalizeFood(food);
  const tags = Array.isArray(food?.tags) ? food.tags.filter(Boolean) : [];

  return {
    ...food,
    ...base,
    kcal: getFoodEnergy({ ...food, ...base }),
    tags,
  };
};

const matchesPreference = (food, preference) => {
  const text = `${food?.name || ""} ${(food?.tags || []).join(" ")}`;

  if (preference === "vegetarian") {
    return !ANIMAL_REGEX.test(text);
  }

  if (preference === "lowcarb") {
    return safeNum(food?.carbs) <= 30;
  }

  return true;
};

const getMealTagScore = (food, mealType) => {
  const text = `${food?.name || ""} ${(food?.tags || []).join(" ")}`;
  const patterns = MEAL_TAG_PATTERNS[mealType] || [];
  return patterns.some((rx) => rx.test(text)) ? 45 : 0;
};

const scoreFoodForMeal = ({
  food,
  mealType,
  preference,
  targetKcal,
  targetProtein,
  targetFat,
  targetCarbs,
  usedCounts,
}) => {
  const energy = getFoodEnergy(food);
  const protein = safeNum(food?.protein);
  const fat = safeNum(food?.fat);
  const carbs = safeNum(food?.carbs);
  const repeatCount = usedCounts.get(food.name) || 0;

  let score = 0;

  score -= Math.abs(energy - targetKcal) * 0.55;
  score -= Math.abs(protein - targetProtein) * 1.8;
  score -= Math.abs(fat - targetFat) * 1.15;
  score -= Math.abs(carbs - targetCarbs) * 0.75;

  if (mealType !== "snack" && energy < Math.max(220, targetKcal * 0.6)) score -= 120;
  if (mealType === "snack" && energy < 140) score -= 80;
  if (mealType === "snack" && energy > targetKcal * 1.8) score -= 55;

  if (mealType === "breakfast" && protein < 15) score -= 40;
  if ((mealType === "lunch" || mealType === "dinner") && protein < 20) score -= 35;

  if (preference === "lowcarb") {
    if (mealType === "snack" && carbs > 18) score -= 75;
    if ((mealType === "lunch" || mealType === "dinner") && carbs > 32) score -= 55;
  }

  if (preference === "vegetarian" && !matchesPreference(food, preference)) score -= 9999;

  score += getMealTagScore(food, mealType);

  if (safeNum(food?.protein) >= 25) score += 16;
  if ((food?.tags || []).includes("υψηλή πρωτεΐνη")) score += 10;
  if ((food?.tags || []).includes("για δίαιτα") && targetKcal < 450) score += 8;
  if ((food?.tags || []).includes("γρήγορο") && mealType === "snack") score += 8;

  if (energy >= 250) score += 10;
  if (repeatCount > 0) score -= repeatCount * 24;

  return score;
};

export default function NutritionModule() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  const ui = useMemo(() => getNutritionUiTokens(theme), [theme]);

  const [simpleView, setSimpleView] = useState(false);
  const [foodSearch, setFoodSearch] = useState("");
  const [intakeKcal, setIntakeKcal] = useState("");
  const [macrosText, setMacrosText] = useState("");
  const [newFood, setNewFood] = useState({ name: "", protein: "", fat: "", carbs: "" });
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState(1.55);
  const [bmr, setBmr] = useState(null);
  const [tdee, setTdee] = useState(null);
  const [protein, setProtein] = useState(() => readStoredNumber("protein", 2));
  const [fat, setFat] = useState(() => readStoredNumber("fat", 1));
  const [carbs, setCarbs] = useState(() => readStoredNumber("carbs", null));
  const [intakeHistory, setIntakeHistory] = useState([]);
  const [preference, setPreference] = useState(() => readStoredString("preference", "default"));
  const [daysOrder, setDaysOrder] = useState(() => readStoredJson("daysOrder", DEFAULT_DAYS_ORDER));
  const [customMeals, setCustomMeals] = useState(() => readStoredJson("customMeals", {}));
  const [selectedDay, setSelectedDay] = useState(() => {
    const arr = readStoredJson("daysOrder", DEFAULT_DAYS_ORDER);
    return arr[0];
  });
  const [selectedMealType, setSelectedMealType] = useState("snack");
  const [userFoods, setUserFoods] = useState(() => readStoredJson("userFoods", []));
  const [localSaveStatus, setLocalSaveStatus] = useState("ready");
  const [lastLocalSavedAt, setLastLocalSavedAt] = useState(null);

  useNutritionPersistence({ protein, fat, carbs, preference, daysOrder, customMeals, userFoods });

  const foodDB = useMemo(
    () => [
      { name: "Αβγό", protein: 6, fat: 5, carbs: 0.5, tags: [] },
      { name: "Κοτόπουλο (100g)", protein: 31, fat: 3.6, carbs: 0, tags: [] },
      { name: "Ρύζι (100g μαγειρεμένο)", protein: 2.7, fat: 0.3, carbs: 28, tags: [] },
      { name: "Μπανάνα", protein: 1.3, fat: 0.3, carbs: 27, tags: [] },
      { name: "Γιαούρτι 2% (100g)", protein: 10, fat: 2, carbs: 4, tags: [] },
      { name: "Φακές (μαγειρεμένες)", protein: 9, fat: 0.4, carbs: 20, tags: ["vegetarian"] },
      { name: "Τοφού", protein: 8, fat: 4.8, carbs: 1.9, tags: ["vegetarian"] },
      { name: "Σολωμός (100g)", protein: 20, fat: 13, carbs: 0, tags: [] },
      { name: "Ψωμί ολικής (φέτα)", protein: 4, fat: 1, carbs: 12, tags: ["vegetarian"] },
      { name: "Αμύγδαλα (10τμχ)", protein: 2.5, fat: 5.5, carbs: 2, tags: ["vegetarian", "lowcarb"] },
    ],
    []
  );

  const allFoods = useMemo(() => {
    const merged = [...foodDB, ...defaultMeals, ...userFoods]
      .filter(isValidFood)
      .map(normalizeFoodEntry);

    const deduped = [];
    const seen = new Set();

    merged.forEach((food) => {
      const key = String(food.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      deduped.push(food);
    });

    return deduped;
  }, [foodDB, userFoods]);

  const plannerFoods = useMemo(() => {
    const premiumPool = [...defaultMeals, ...userFoods]
      .filter(isValidFood)
      .map(normalizeFoodEntry)
      .filter((food) => getFoodEnergy(food) >= 180);

    const fallbackPool = allFoods.filter((food) => getFoodEnergy(food) >= 180);

    const source = premiumPool.length >= 8 ? premiumPool : fallbackPool;

    const deduped = [];
    const seen = new Set();

    source.forEach((food) => {
      const key = String(food.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      deduped.push(food);
    });

    return deduped;
  }, [allFoods, userFoods]);

  const filteredFoods = useMemo(
    () => allFoods.filter((item) => item.name.toLowerCase().includes(foodSearch.toLowerCase())),
    [foodSearch, allFoods]
  );

  const filteredFoodsSafe = filteredFoods.filter(isValidFood);
  const userFoodsSafe = userFoods.filter(isValidFood).map(normalizeFoodEntry);

  const localSaveReadyRef = useRef(false);
  useEffect(() => {
    if (!localSaveReadyRef.current) {
      localSaveReadyRef.current = true;
      return;
    }

    setLocalSaveStatus("saving");
    const id = setTimeout(() => {
      setLocalSaveStatus("saved");
      setLastLocalSavedAt(new Date().toISOString());
    }, 220);

    return () => clearTimeout(id);
  }, [protein, fat, carbs, preference, daysOrder, customMeals, userFoods]);

  const calculateNutrition = useCallback(() => {
    const summary = calculateNutritionSummary({
      weight,
      height,
      age,
      gender,
      activity,
      proteinPerKg: protein,
      fatPerKg: fat,
    });
    setBmr(summary.bmr);
    setTdee(summary.tdee);
    setCarbs(summary.carbs);
  }, [weight, height, age, gender, activity, protein, fat]);

  const didInitialCalc = useRef(false);
  useEffect(() => {
    if (!didInitialCalc.current) {
      calculateNutrition();
      didInitialCalc.current = true;
      return;
    }
    const id = setTimeout(calculateNutrition, 150);
    return () => clearTimeout(id);
  }, [calculateNutrition]);

  const getCurrentSummary = useCallback(() => {
    return calculateNutritionSummary({
      weight,
      height,
      age,
      gender,
      activity,
      proteinPerKg: protein,
      fatPerKg: fat,
    });
  }, [weight, height, age, gender, activity, protein, fat]);

  const pickFoodForMeal = useCallback(
    ({ mealType, usedCounts, currentMealName = "" }) => {
      const summary = getCurrentSummary();
      const ratios = MEAL_TARGET_RATIOS[mealType];
      const targetKcal = safeNum(summary.tdee) * ratios.kcal;
      const targetProtein = safeNum(summary.protein) * ratios.protein;
      const targetFat = safeNum(summary.fat) * ratios.fat;
      const targetCarbs = safeNum(summary.carbs) * ratios.carbs;

      const candidates = plannerFoods
        .filter((food) => matchesPreference(food, preference))
        .map((food) => ({
          food,
          score: scoreFoodForMeal({
            food,
            mealType,
            preference,
            targetKcal,
            targetProtein,
            targetFat,
            targetCarbs,
            usedCounts,
          }),
        }))
        .sort((a, b) => b.score - a.score);

      if (!candidates.length) return null;

      const topCandidates = candidates.slice(0, 6).map((entry) => entry.food);
      const alternatives = topCandidates.filter((food) => food.name !== currentMealName);
      const finalPool = alternatives.length ? alternatives : topCandidates;

      return finalPool[Math.floor(Math.random() * finalPool.length)] || finalPool[0] || null;
    },
    [plannerFoods, preference, getCurrentSummary]
  );

  const handleReplacement = useCallback(
    (day, mealType) => {
      const mealKey = `${day}-${mealType}`;
      const currentMealName = customMeals?.[mealKey] || "";
      const usedCounts = new Map();

      Object.values(customMeals || {}).forEach((name) => {
        if (!name) return;
        usedCounts.set(name, (usedCounts.get(name) || 0) + 1);
      });

      const picked = pickFoodForMeal({ mealType, usedCounts, currentMealName });
      if (!picked) return;

      setCustomMeals((prev) => ({ ...prev, [mealKey]: picked.name }));
    },
    [customMeals, pickFoodForMeal]
  );

  const generateMealPlanFromTargets = useCallback(() => {
    const summary = getCurrentSummary();

    if (!safeNum(summary.tdee)) {
      calculateNutrition();
    }

    const filteredPlannerFoods = plannerFoods.filter((food) => matchesPreference(food, preference));

    if (!filteredPlannerFoods.length) {
      alert("❌ Δεν βρέθηκαν κατάλληλα γεύματα για την επιλεγμένη προτίμηση.");
      return;
    }

    const usedCounts = new Map();
    const next = {};

    daysOrder.forEach((day) => {
      MEAL_TYPES.forEach((mealType) => {
        const picked = pickFoodForMeal({
          mealType,
          usedCounts,
          currentMealName: "",
        });

        if (picked?.name) {
          next[`${day}-${mealType}`] = picked.name;
          usedCounts.set(picked.name, (usedCounts.get(picked.name) || 0) + 1);
        }
      });
    });

    setCustomMeals(next);
  }, [daysOrder, preference, plannerFoods, pickFoodForMeal, getCurrentSummary, calculateNutrition]);

  const handleGenerateAIPlan = useCallback(() => {
    try {
      generateMealPlanFromTargets();
    } catch (error) {
      console.error("handleGenerateAIPlan:", error?.message || error);
      alert("❌ Αποτυχία δημιουργίας πλάνου.");
    }
  }, [generateMealPlanFromTargets]);

  const foodByName = useMemo(() => createFoodMap(allFoods), [allFoods]);

  const saveMealsToSupabase = useCallback(async () => {
    if (!user?.id) return;
    try {
      await saveMealsRequest({ userId: user.id, customMeals });
    } catch (e) {
      console.error("saveMealsToSupabase:", e?.message || e);
    }
  }, [user?.id, customMeals]);

  const loadMealsFromSupabase = useCallback(async () => {
    if (!user?.id) return;
    try {
      const restored = await loadMealsRequest({ userId: user.id });
      setCustomMeals(restored);
    } catch (e) {
      console.error("loadMealsFromSupabase:", e?.message || e);
    }
  }, [user?.id]);

  const savePlanToSupabase = useCallback(async () => {
    if (!user?.id) return;
    try {
      await savePlanRequest({ userId: user.id, customMeals });
    } catch (e) {
      console.error("savePlanToSupabase:", e?.message || e);
    }
  }, [user?.id, customMeals]);

  const loadPlanFromSupabase = useCallback(async () => {
    if (!user?.id) return;
    try {
      const restored = await loadPlanRequest({ userId: user.id });
      setCustomMeals(restored || {});
    } catch (e) {
      console.error("loadPlanFromSupabase:", e?.message || e);
    }
  }, [user?.id]);

  const { syncStatus, lastSyncAt } = useNutritionSync({
    userId: user?.id,
    bmr,
    tdee,
    protein,
    fat,
    carbs,
    weight,
    setIntakeHistory,
  });

  const addCustomFood = useCallback(() => {
    if (!canAddFood(newFood)) {
      alert("❌ Παρακαλώ συμπλήρωσε όλα τα πεδία σωστά.");
      return;
    }

    const payload = normalizeFood(newFood);
    const kcal = round1(payload.protein * 4 + payload.fat * 9 + payload.carbs * 4);

    setUserFoods((prev) => [...prev, { ...payload, kcal, tags: ["custom"] }]);
    setNewFood({ name: "", protein: "", fat: "", carbs: "" });
  }, [newFood]);

  const pieData = useMemo(
    () => [
      { name: "Protein", value: safeNum(protein) * safeNum(weight) },
      { name: "Fat", value: safeNum(fat) * safeNum(weight) },
      { name: "Carbs", value: safeNum(carbs) },
    ],
    [protein, fat, carbs, weight]
  );

  const totalMacros = useMemo(
    () => getTotalMacrosFromMeals(customMeals, foodByName),
    [customMeals, foodByName]
  );

  const planKcal = useMemo(() => {
    return Math.round(
      Object.values(customMeals || {}).reduce((sum, mealName) => {
        const food = foodByName.get(mealName);
        return sum + getFoodEnergy(food);
      }, 0)
    );
  }, [customMeals, foodByName]);

  const totalMealSlots = (daysOrder?.length || 0) * 4;
  const filledMeals = useMemo(
    () => Object.values(customMeals || {}).filter(Boolean).length,
    [customMeals]
  );

  const plannerSummary = useMemo(() => {
    const summary = getCurrentSummary();
    const targetKcal = safeNum(summary.tdee) * (daysOrder.length || 0);
    const kcalGap = planKcal - targetKcal;
    const pct = targetKcal ? (planKcal / targetKcal) * 100 : 0;

    let tone = "neutral";
    let message = "Συμπλήρωσε στοιχεία και γεύματα για να αξιολογηθεί το πλάνο.";

    if (filledMeals === totalMealSlots && targetKcal > 0) {
      if (pct < 80) {
        tone = "bad";
        message =
          "Το πλάνο παραμένει πολύ χαμηλά σε θερμίδες σε σχέση με τον εβδομαδιαίο στόχο. Δηλαδή όχι “cut”, αλλά διατροφικό φρένο χειρός.";
      } else if (pct > 120) {
        tone = "warn";
        message =
          "Το πλάνο έχει ξεφύγει προς τα πάνω. Αν ο στόχος δεν είναι καθαρό surplus, εδώ αρχίζει η στραβή.";
      } else {
        tone = "good";
        message =
          "Η συνολική ενέργεια του πλάνου κινείται σε λογικό εύρος σε σχέση με τον στόχο. Τουλάχιστον εδώ δεν γράφουμε fan fiction.";
      }
    }

    return {
      targetKcal: Math.round(targetKcal),
      kcalGap: Math.round(kcalGap),
      pct: round1(pct),
      tone,
      message,
    };
  }, [getCurrentSummary, daysOrder.length, planKcal, filledMeals, totalMealSlots]);

  const sectionStyle = ui.section;
  const inputStyle = ui.input;
  const rowBg = ui.row;
  const rowAltBg = ui.rowAlt;
  const headBg = ui.head;
  const borderCol = ui.border;
  const headText = ui.headText;
  const cellText = ui.cellText;

  const exportToPDF = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const el =
        document.getElementById("nutrition-print") ||
        document.querySelector("#root") ||
        document.body;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let imgW = pageW;
      let imgH = (canvas.height * imgW) / canvas.width;

      if (imgH > pageH) {
        const r = pageH / imgH;
        imgW *= r;
        imgH = pageH;
      }

      const x = (pageW - imgW) / 2;
      pdf.addImage(imgData, "PNG", x, 0, imgW, imgH, undefined, "FAST");
      const today = new Date().toLocaleDateString("el-GR").replaceAll("/", "-");
      pdf.save(`nutrition-plan-${today}.pdf`);
    } catch (err) {
      console.error("exportToPDF:", err);
      alert("❌ Αποτυχία δημιουργίας PDF.");
    }
  };

  const exportToCSV = () => {
    try {
      const days = daysOrder?.length ? daysOrder : DEFAULT_DAYS_ORDER;
      const mealOf = (d, t) => customMeals?.[`${d}-${t}`] ?? "";

      const esc = (v) => {
        const s = String(v ?? "");
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const header = ["Ημέρα", "Πρωινό", "Μεσημεριανό", "Σνακ", "Βραδινό"]
        .map(esc)
        .join(",");

      const rows = days.map((d) =>
        [
          d,
          mealOf(d, "breakfast"),
          mealOf(d, "lunch"),
          mealOf(d, "snack"),
          mealOf(d, "dinner"),
        ]
          .map(esc)
          .join(",")
      );

      const csv = [header, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meal-plan.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("exportToCSV:", err);
      alert("❌ Αποτυχία δημιουργίας CSV.");
    }
  };

  const sharePlan = async () => {
    const days = daysOrder?.length ? daysOrder : DEFAULT_DAYS_ORDER;
    const mealOf = (d, t) => customMeals?.[`${d}-${t}`] || "-";
    const body = days
      .map(
        (day) =>
          `${day}:\n🍽️ Πρωινό: ${mealOf(day, "breakfast")}\n🥗 Μεσημεριανό: ${mealOf(
            day,
            "lunch"
          )}\n🥚 Σνακ: ${mealOf(day, "snack")}\n🍝 Βραδινό: ${mealOf(day, "dinner")}`
      )
      .join("\n\n");

    const text = `📅 Εβδομαδιαίο πλάνο γευμάτων\n\n${body}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Πλάνο γευμάτων", text });
        return;
      }
    } catch {}

    try {
      await navigator.clipboard.writeText(text);
      alert("📋 Το πλάνο αντιγράφηκε στο πρόχειρο!");
      return;
    } catch {}

    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meal-plan.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("❌ Αποτυχία κοινοποίησης.");
    }
  };

  const plannerAlertClass =
    plannerSummary.tone === "good"
      ? theme === "dark"
        ? "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300"
        : "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
      : plannerSummary.tone === "bad"
      ? theme === "dark"
        ? "rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
        : "rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
      : plannerSummary.tone === "warn"
      ? theme === "dark"
        ? "rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-300"
        : "rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800"
      : ui.summaryBox;

  return (
    <>
      {!user?.id && (
        <div className="mb-4 rounded border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
          Δεν έχεις συνδεθεί — το πλάνο λειτουργεί τοπικά. Cloud sync/αποθήκευση θα ενεργοποιηθούν μόλις συνδεθείς.
        </div>
      )}

      <motion.div
        id="nutrition-print"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className={`nutrition-lab min-h-screen px-4 py-8 md:px-6 xl:px-8 space-y-8 transition-colors duration-500 ${
          theme === "dark" ? "bg-black text-zinc-100" : "bg-white text-zinc-900"
        }`}
      >
        <Helmet>
          <title>Nutrition Module | Health's Spot</title>
          <meta
            name="description"
            content="Υπολόγισε BMR, TDEE και διατροφικούς στόχους στο Health's Spot Nutrition Module."
          />
          <link rel="canonical" href="https://healthsspot.vercel.app/nutrition" />
        </Helmet>

        <div className="mx-auto w-full max-w-7xl space-y-8">
          <div className="sticky top-0 z-50 bg-inherit py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-yellow-400 drop-shadow">
                  🧪 Nutrition Lab
                </h1>
                <p className={ui.mutedText}>
                  Πιο τίμιο generation logic, πιο σωστή θερμιδική αποτίμηση, λιγότερο “4 τρόφιμα και 600 kcal όλη μέρα”.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
                <button
                  onClick={() => setSimpleView(!simpleView)}
                  className="rounded-xl bg-yellow-300 px-3 py-2 text-sm font-medium text-black hover:bg-yellow-400"
                >
                  {simpleView ? "💡 Προηγμένη Έκδοση" : "✨ Απλοποιημένη Έκδοση"}
                </button>

                <button
                  onClick={toggleTheme}
                  className={ui.secondaryButton + " text-2xl px-3 py-1"}
                  title="Αλλαγή Θέματος"
                >
                  {theme === "dark" ? "☀" : "🌙"}
                </button>
              </div>
            </div>
          </div>

          <NutritionStatusBar
            ui={ui}
            userId={user?.id}
            localStatus={localSaveStatus}
            lastLocalSavedAt={lastLocalSavedAt}
            cloudStatus={syncStatus}
            lastCloudSyncAt={lastSyncAt}
            foodsTotal={allFoods.length}
            customFoodsCount={userFoodsSafe.length}
            filledMeals={filledMeals}
            totalMealSlots={totalMealSlots}
            planKcal={planKcal}
            tdee={tdee}
          />

          <div className={plannerAlertClass}>
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <h3 className={ui.label}>Sanity check πλάνου</h3>
                <p className="mt-2 text-sm">{plannerSummary.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={ui.metricCard}>
                  <p className={ui.helper}>Plan kcal</p>
                  <p className="mt-2 text-2xl font-bold">{planKcal}</p>
                </div>
                <div className={ui.metricCard}>
                  <p className={ui.helper}>Weekly target kcal</p>
                  <p className="mt-2 text-2xl font-bold">{plannerSummary.targetKcal || "--"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (window.confirm("Θες σίγουρα να κάνεις επαναφορά όλων;")) {
                    setProtein(2);
                    setFat(1);
                    setPreference("default");
                    setDaysOrder(DEFAULT_DAYS_ORDER);
                    setCustomMeals({});
                    setUserFoods([]);
                    setFoodSearch("");
                    setIntakeKcal("");
                    setMacrosText("");
                    setNewFood({ name: "", protein: "", fat: "", carbs: "" });
                    setSelectedDay(DEFAULT_DAYS_ORDER[0]);
                    setSelectedMealType("snack");
                    setCarbs(null);
                    setWeight(70);
                    setHeight(175);
                    setAge(25);
                    setGender("male");
                    setActivity(1.55);
                    setBmr(null);
                    setTdee(null);
                    setIntakeHistory([]);
                    setLocalSaveStatus("saved");
                    setLastLocalSavedAt(new Date().toISOString());
                    [
                      "protein",
                      "fat",
                      "preference",
                      "daysOrder",
                      "carbs",
                      "customMeals",
                      "userFoods",
                    ].forEach((key) => localStorage.removeItem(key));
                  }
                }}
                className="inline-flex items-center justify-center rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
              >
                🔁 Επαναφορά Όλων
              </button>

              <div className={ui.badge}>
                🧾 Plan coverage: {filledMeals}/{totalMealSlots}
              </div>
            </div>

            <BmrTdeeSection
              theme={theme}
              ui={ui}
              weight={weight}
              setWeight={setWeight}
              height={height}
              setHeight={setHeight}
              age={age}
              setAge={setAge}
              gender={gender}
              setGender={setGender}
              activity={activity}
              setActivity={setActivity}
              calculateNutrition={calculateNutrition}
              bmr={bmr}
              tdee={tdee}
            />
          </div>

          <MacroGoalsSection
            protein={protein}
            setProtein={setProtein}
            fat={fat}
            setFat={setFat}
            weight={weight}
            carbs={carbs}
            pieData={pieData}
            theme={theme}
            preference={preference}
            setPreference={setPreference}
            getProteinLabel={getProteinLabel}
            getFatLabel={getFatLabel}
            generateMealPlanFromTargets={generateMealPlanFromTargets}
            handleGenerateAIPlan={handleGenerateAIPlan}
            ui={ui}
          />

          {!simpleView && (
            <div className="space-y-4">
              <div className={ui.summaryBox}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className={ui.label}>Προεπισκόπηση εβδομαδιαίου πλάνου</h3>
                    <p className={ui.mutedText}>
                      Εδώ φαίνεται γρήγορα αν το generator έβγαλε meal plan ή απλώς πέταξε λίγα τρόφιμα για να πει ότι κάτι έκανε.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={ui.badge}>🔥 {planKcal} kcal / εβδομάδα</span>
                    <span className={ui.badge}>
                      🎯 {plannerSummary.targetKcal || "--"} kcal στόχος
                    </span>
                    <span className={ui.badge}>
                      📊 {plannerSummary.pct ? `${plannerSummary.pct}%` : "--"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {daysOrder.map((day) => (
                  <PlanDayCard key={day} day={day} customMeals={customMeals} allFoods={allFoods} />
                ))}
              </div>
            </div>
          )}

          <AnalyticsSection
            tdee={tdee}
            protein={protein}
            fat={fat}
            weight={weight}
            carbs={carbs}
            intakeKcal={intakeKcal}
            setIntakeKcal={setIntakeKcal}
            macrosText={macrosText}
            setMacrosText={setMacrosText}
            inputStyle={inputStyle}
            totalMacros={totalMacros}
            planKcal={planKcal}
            daysOrder={daysOrder}
            customMeals={customMeals}
            allFoodsFull={allFoods}
            saveMealsToSupabase={saveMealsToSupabase}
            loadMealsFromSupabase={loadMealsFromSupabase}
            savePlanToSupabase={savePlanToSupabase}
            loadPlanFromSupabase={loadPlanFromSupabase}
            userId={user?.id}
            exportToPDF={exportToPDF}
            exportToCSV={exportToCSV}
            sharePlan={sharePlan}
            intakeHistory={intakeHistory}
            theme={theme}
            ui={ui}
          />

          <MealPlannerSection
            daysOrder={daysOrder}
            setDaysOrder={setDaysOrder}
            customMeals={customMeals}
            setCustomMeals={setCustomMeals}
            allFoodsFull={allFoods}
            handleReplacement={handleReplacement}
            theme={theme}
            ui={ui}
            protein={protein}
            fat={fat}
            carbs={carbs}
            weight={weight}
            totalMacros={totalMacros}
            planKcal={planKcal}
            safeNum={safeNum}
            round1={round1}
          />

          <FoodsSection
            inputStyle={inputStyle}
            foodSearch={foodSearch}
            setFoodSearch={setFoodSearch}
            newFood={newFood}
            setNewFood={setNewFood}
            addCustomFood={addCustomFood}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            selectedMealType={selectedMealType}
            setSelectedMealType={setSelectedMealType}
            daysOrder={daysOrder}
            foods={filteredFoodsSafe}
            userFoods={userFoodsSafe}
            setUserFoods={setUserFoods}
            setCustomMeals={setCustomMeals}
            sectionStyle={sectionStyle}
            borderCol={borderCol}
            headBg={headBg}
            headText={headText}
            cellText={cellText}
            rowAltBg={rowAltBg}
            rowBg={rowBg}
          />
        </div>
      </motion.div>
    </>
  );
}