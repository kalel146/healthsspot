// NutritionModule.jsx — consolidated, cleaned, production-ready

import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CartesianGrid, Legend, ReferenceLine } from "recharts";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "./supabaseClient";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser, SignedIn } from "@clerk/clerk-react";
import { useTheme } from "./ThemeContext";
import defaultMeals from "./defaultMeals.json";
import CollapsibleSection from "./CollapsibleSection";
import MacroSlider from "./MacroSlider";
import MacroPieChart from "./MacroPieChart";
import PreferenceSelector from "./PreferenceSelector";
import PlanDayCard from "./PlanDayCard";
import { Tabs, Tab } from "./TabsComponent";
import TabsCompo from "./TabsCompo";
import MacroComparisonChart from "./MacroComparisonChart";
import MacroBarChart from "./MacroBarChart";

// -------------------------
// Sortable list item
// -------------------------
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "0.25rem",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-zinc-800 shadow-sm p-2 rounded text-sm"
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export default function NutritionModule() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  // -------------------------
  // State
  // -------------------------
  const [simpleView, setSimpleView] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [foodSearch, setFoodSearch] = useState("");
// --- ΝΕΑ STATES --- //
const [intakeKcal, setIntakeKcal] = useState("");
const [macrosText, setMacrosText] = useState(""); // π.χ. "140/50/200"
const [newFood, setNewFood] = useState({ name: "", protein: "", fat: "", carbs: "" });

  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState(1.55);

  const [bmr, setBmr] = useState(null);
  const [tdee, setTdee] = useState(null);

  const [protein, setProtein] = useState(
    () => parseFloat(localStorage.getItem("protein")) || 2
  );
  const [fat, setFat] = useState(
    () => parseFloat(localStorage.getItem("fat")) || 1
  );
  const [carbs, setCarbs] = useState(() => {
    const saved = localStorage.getItem("carbs");
    return saved ? parseFloat(saved) : null;
  });

  const [intakeHistory, setIntakeHistory] = useState([]);
  const [preference, setPreference] = useState(
    () => localStorage.getItem("preference") || "default"
  );
  const [daysOrder, setDaysOrder] = useState(() => {
    const saved = localStorage.getItem("daysOrder");
    return saved
      ? JSON.parse(saved)
      : ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
  });

  const [customMeals, setCustomMeals] = useState(() => {
    const saved = localStorage.getItem("customMeals");
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedDay, setSelectedDay] = useState(() => {
    const saved = localStorage.getItem("daysOrder");
    const arr = saved
      ? JSON.parse(saved)
      : ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
    return arr[0];
  });
  const [selectedMealType, setSelectedMealType] = useState("snack");

  const [userFoods, setUserFoods] = useState(() => {
    const saved = localStorage.getItem("userFoods");
    return saved ? JSON.parse(saved) : [];
  });

  // -------------------------
  // Food DB
  // -------------------------
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

  const mealOptions = {
    breakfast: [
      { name: "Βρώμη με γάλα και μπανάνα", protein: 12, fat: 6, carbs: 45, tags: ["vegetarian"] },
      { name: "Αβγά με τοστ ολικής", protein: 18, fat: 12, carbs: 20, tags: [] },
      { name: "Smoothie με πρωτεΐνη και μούρα", protein: 25, fat: 3, carbs: 15, tags: ["vegetarian"] },
      { name: "Γιαούρτι με μέλι και καρύδια", protein: 15, fat: 8, carbs: 20, tags: ["vegetarian"] },
    ],
    lunch: [
      { name: "Κοτόπουλο με ρύζι και μπρόκολο", protein: 35, fat: 5, carbs: 50, tags: [] },
      { name: "Τοφού stir-fry με λαχανικά", protein: 25, fat: 10, carbs: 30, tags: ["vegetarian"] },
      { name: "Μοσχάρι με πατάτες φούρνου", protein: 30, fat: 15, carbs: 40, tags: [] },
      { name: "Φακές με καστανό ρύζι", protein: 20, fat: 4, carbs: 55, tags: ["vegetarian"] },
    ],
    snack: [
      { name: "Γιαούρτι με φρούτα", protein: 10, fat: 4, carbs: 15, tags: ["vegetarian"] },
      { name: "Protein bar", protein: 20, fat: 5, carbs: 20, tags: [] },
      { name: "Αμύγδαλα και μήλο", protein: 6, fat: 9, carbs: 22, tags: ["vegetarian"] },
      { name: "Βραστό αυγό με φρυγανιά", protein: 8, fat: 6, carbs: 14, tags: [] },
    ],
    dinner: [
      { name: "Ψάρι με κους κους", protein: 28, fat: 8, carbs: 35, tags: [] },
      { name: "Ομελέτα με λαχανικά", protein: 22, fat: 10, carbs: 10, tags: [] },
      { name: "Κινόα με φασόλια", protein: 18, fat: 6, carbs: 40, tags: ["vegetarian"] },
      { name: "Ρεβύθια με καρότο και πατάτα", protein: 20, fat: 5, carbs: 45, tags: ["vegetarian"] },
    ],
  };

  const mealOptionsFlat = useMemo(
    () => Object.values(mealOptions).flat(),
    []
  );

  const allFoods = useMemo(
    () => [...foodDB, ...defaultMeals, ...userFoods],
    [foodDB, userFoods]
  );

  // Ενιαία λίστα για όλα τα lookups (πιάνει και mealOptions)
  const allFoodsFull = useMemo(
    () => [...allFoods, ...mealOptionsFlat],
    [allFoods, mealOptionsFlat]
  );

  const filteredFoods = useMemo(
    () =>
      allFoods.filter((item) =>
        item.name.toLowerCase().includes(foodSearch.toLowerCase())
      ),
    [foodSearch, allFoods]
  );

  // -------------------------
  // Persist
  // -------------------------
  useEffect(() => {
    localStorage.setItem("userFoods", JSON.stringify(userFoods));
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
    localStorage.setItem("daysOrder", JSON.stringify(daysOrder));
  }, [daysOrder]);

  useEffect(() => {
    localStorage.setItem("customMeals", JSON.stringify(customMeals));
  }, [customMeals]);

  // -------------------------
  // Theme sync (system)
  // -------------------------
  useEffect(() => {
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (systemPrefersDark && theme !== "dark") toggleTheme();
    if (!systemPrefersDark && theme === "dark") toggleTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Helpers
  // -------------------------
  const getProteinLabel = (value) => {
    if (value < 1.2) return "Χαμηλή πρόσληψη πρωτεΐνης (π.χ. καθιστικοί ενήλικες)";
    if (value < 2) return "Μέτρια πρόσληψη πρωτεΐνης (π.χ. fitness / υγιεινή διατροφή)";
    return "Υψηλή πρόσληψη πρωτεΐνης (π.χ. bodybuilding, εντατική άσκηση)";
  };

  const getFatLabel = (value) => {
    if (value < 0.6)
      return "Πολύ χαμηλά λιπαρά (προσοχή σε έλλειψη απαραίτητων λιπαρών οξέων)";
    if (value < 1.2) return "Μέτρια λιπαρά (ισορροπημένη διατροφή)";
    return "Υψηλή πρόσληψη λιπαρών (πιθανή αύξηση θερμιδικής πρόσληψης)";
  };

  const calculateNutrition = () => {
    const calculatedBmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
    const calculatedTdee = calculatedBmr * activity;
    setBmr(Number(calculatedBmr.toFixed(1)));
    setTdee(Number(calculatedTdee.toFixed(1)));

    const kcalFromProtein = protein * weight * 4;
    const kcalFromFat = fat * weight * 9;
    const remainingKcal = calculatedTdee - (kcalFromProtein + kcalFromFat);
    const gCarbs = Math.max(0, remainingKcal / 4);
    setCarbs(Number(gCarbs.toFixed(1)));
  };

  const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmtG = (v) => (Number.isFinite(v) ? `${v}g` : "—");
const kcalOf = (it) => {
  const p = toNum(it.protein);
  const f = toNum(it.fat);
  const c = toNum(it.carbs);
  const kcal = p * 4 + f * 9 + c * 4;
  return Number.isFinite(kcal) ? `${kcal} kcal` : "—";
};

const isValidFood = (it) =>
  Number.isFinite(toNum(it.protein)) &&
  Number.isFinite(toNum(it.fat)) &&
  Number.isFinite(toNum(it.carbs));
const filteredFoodsSafe = filteredFoods.filter(isValidFood);
const userFoodsSafe = userFoods.filter(isValidFood);


  // -------------------------
  // Supabase sync & history
  // -------------------------
  useEffect(() => {
    if (!tdee || !protein || !fat || !carbs || !user?.id) return;

    const syncToSupabase = async () => {
      const { error } = await supabase.from("nutrition_data").upsert({
        user_id: user.id,
        week: 1,
        bmr: parseFloat(bmr),
        vo2: null,
        protein: protein * weight,
        carbs: parseFloat(carbs),
        fat: fat * weight,
        stress_monday: null,
        stress_tuesday: null,
      });
      if (error) console.error("❌ Supabase sync error:", error.message);
    };

    const logDailyIntake = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("intake_logs").upsert({
        user_id: user.id,
        date: today,
        kcal: parseFloat(tdee),
        protein: protein * weight,
        carbs: parseFloat(carbs),
        fat: fat * weight,
      });
      if (error) console.error("❌ Intake log error:", error.message);
    };

    const fetchIntakeHistory = async () => {
      const { data, error } = await supabase
        .from("intake_logs")
        .select("date, kcal")
        .eq("user_id", user.id)
        .order("date", { ascending: true });
      if (!error && data) setIntakeHistory(data);
    };

    (async () => {
      await syncToSupabase();
      await logDailyIntake();
      await fetchIntakeHistory();
    })();
  }, [protein, fat, carbs, bmr, tdee, weight, user?.id]);

  // -------------------------
  // Meal plan helpers
  // -------------------------
  const isVegName = (name) => {
    const n = (name || "").toLowerCase();
    return !(
      n.includes("κοτόπουλ") ||
      n.includes("μοσχ") ||
      n.includes("ψάρι") ||
      n.includes("αυγ") ||
      n.includes("αβγ")
    );
  };

  const getRandomMeal = (type) => {
    const meals = mealOptions[type] || [];
    const filteredMeals = meals.filter((meal) => {
      if (preference === "vegetarian") return isVegName(meal.name);
      if (preference === "lowcarb") return meal.carbs < 20;
      return true;
    });
    const pool = filteredMeals.length > 0 ? filteredMeals : meals;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const handleReplacement = (day, mealType) => {
    const currentMeal = customMeals[`${day}-${mealType}`];
    const allMeals = [...(mealOptions[mealType] || []), ...allFoodsFull];
    const current = allMeals.find((m) => m.name === currentMeal);
    if (!current) return;

    const diff = (a, b) => Math.abs(Number(a) - Number(b)) / (Number(b) || 1);
    const alternatives = allMeals.filter(
      (m) =>
        diff(m.protein, current.protein) < 0.2 &&
        diff(m.fat, current.fat) < 0.2 &&
        diff(m.carbs, current.carbs) < 0.2 &&
        m.name !== current.name
    );

    if (alternatives.length > 0) {
      const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
      setCustomMeals((prev) => ({ ...prev, [`${day}-${mealType}`]: alt.name }));
    } else {
      alert("❌ Δεν βρέθηκαν ισοδύναμες επιλογές.");
    }
  };

  const generateMealPlanFromTargets = () => {
    const target = {
      protein: protein * weight,
      fat: fat * weight,
      carbs: Number(carbs || 0),
    };

    const filterByPref = (item) => {
      if (!item) return false;
      if (preference === "vegetarian") return isVegName(item.name) || item.tags?.includes?.("vegetarian");
      if (preference === "lowcarb") return Number(item.carbs) < 20;
      return true;
    };

    const newPlan = {};
    daysOrder.forEach((day) => {
      ["breakfast", "lunch", "snack", "dinner"].forEach((mealType) => {
        const poolBase = [...(mealOptions[mealType] || []), ...allFoodsFull].filter(filterByPref);
        const pool = poolBase.length
          ? poolBase
          : [...(mealOptions[mealType] || []), ...allFoodsFull];

        let bestFit = pool[0];
        let smallestDiff = Infinity;

        for (const meal of pool) {
          const diff =
            Math.abs(Number(meal.protein) - target.protein / 7 / 4) +
            Math.abs(Number(meal.fat) - target.fat / 7 / 4) +
            Math.abs(Number(meal.carbs) - target.carbs / 7 / 4);
          if (diff < smallestDiff) {
            smallestDiff = diff;
            bestFit = meal;
          }
        }
        newPlan[`${day}-${mealType}`] = bestFit?.name || "";
      });
    });

    setCustomMeals(newPlan);
  };

  const getTotalMacrosFromPlan = () => {
    let totals = { protein: 0, fat: 0, carbs: 0 };
    daysOrder.forEach((day) => {
      ["breakfast", "lunch", "snack", "dinner"].forEach((mealType) => {
        const name = customMeals[`${day}-${mealType}`];
        const meal = allFoodsFull.find((m) => m.name === name);
        if (meal) {
          totals.protein += Number(meal.protein) || 0;
          totals.fat += Number(meal.fat) || 0;
          totals.carbs += Number(meal.carbs) || 0;
        }
      });
    });
    return totals;
  };

  const getTotalKcalFromPlan = (mealsObj) => {
    let totalKcal = 0;
    Object.entries(mealsObj).forEach(([_, name]) => {
      const found = allFoodsFull.find((item) => item.name === name);
      if (found) {
        totalKcal +=
          Number(found.protein) * 4 +
          Number(found.fat) * 9 +
          Number(found.carbs) * 4;
      }
    });
    return Math.round(totalKcal);
  };

  function generateWeeklyMealPlan({ kcal, protein, fat, carbs, preference }) {
    const days = [
      "Δευτέρα",
      "Τρίτη",
      "Τετάρτη",
      "Πέμπτη",
      "Παρασκευή",
      "Σάββατο",
      "Κυριακή",
    ];
    const splitPerMeal = (val) => Math.round(Number(val) / 4);

    const macroPerMeal = {
      protein: splitPerMeal(protein),
      fat: splitPerMeal(fat),
      carbs: splitPerMeal(carbs),
    };

    const filterByPreference = (item) => {
      if (preference === "vegetarian")
        return item.tags?.includes?.("vegetarian") || isVegName(item.name);
      if (preference === "lowcarb") return Number(item.carbs) < 15;
      return true;
    };

    const validFoods = allFoodsFull.filter(filterByPreference);

    const getMeal = () => {
      const options = validFoods.filter(
        (f) =>
          Math.abs(Number(f.protein) - macroPerMeal.protein) <= 5 &&
          Math.abs(Number(f.fat) - macroPerMeal.fat) <= 5 &&
          Math.abs(Number(f.carbs) - macroPerMeal.carbs) <= 10
      );
      if (!options.length)
        return validFoods[Math.floor(Math.random() * validFoods.length)];
      return options[Math.floor(Math.random() * options.length)];
    };

    const weekPlan = {};
    days.forEach((day) => {
      weekPlan[day] = {
        breakfast: getMeal(),
        lunch: getMeal(),
        snack: getMeal(),
        dinner: getMeal(),
      };
    });
    return weekPlan;
  }

  const handleGenerateAIPlan = () => {
    const fallbackKcal =
      protein * weight * 4 + fat * weight * 9 + Number(carbs || 0) * 4;
    const plan = generateWeeklyMealPlan({
      kcal: Number(tdee) || fallbackKcal,
      protein: protein * weight,
      fat: fat * weight,
      carbs: Number(carbs || 0),
      preference,
    });

    // αποθηκεύουμε και readable names
    const normalized = {};
    Object.entries(plan).forEach(([day, obj]) => {
      normalized[`${day}-breakfast`] = obj.breakfast?.name || "";
      normalized[`${day}-lunch`] = obj.lunch?.name || "";
      normalized[`${day}-snack`] = obj.snack?.name || "";
      normalized[`${day}-dinner`] = obj.dinner?.name || "";
    });
    setWeeklyPlan(plan);
    setCustomMeals(normalized);
  };

  const getDayMacroSummary = (dayKey, customMealsObj) => {
    const mealNames = Object.entries(customMealsObj)
      .filter(([key]) => key.startsWith(dayKey))
      .map(([_, value]) => value);

    let total = { protein: 0, fat: 0, carbs: 0 };
    mealNames.forEach((meal) => {
      const food = allFoodsFull.find((f) => f.name === meal);
      if (food) {
        total.protein += Number(food.protein) || 0;
        total.fat += Number(food.fat) || 0;
        total.carbs += Number(food.carbs) || 0;
      }
    });
    return total;
  };

  // -------------------------
  // Supabase save/load (meals/plan)
  // -------------------------
  const saveMealsToSupabase = async () => {
    if (!user?.id) return;
    const entries = Object.entries(customMeals).map(([key, meal_name]) => {
      const [day, meal_type] = key.split("-");
      return { user_id: user.id, day, meal_type, meal_name };
    });

    await supabase.from("meals").delete().eq("user_id", user.id);
    const { error } = await supabase.from("meals").insert(entries);
    if (error) console.error("❌ Error saving meals:", error);
    else console.log("✅ Meals saved successfully!");
  };

  const loadMealsFromSupabase = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("❌ Error loading meals:", error);
      return;
    }
    const restored = {};
    (data || []).forEach(({ day, meal_type, meal_name }) => {
      restored[`${day}-${meal_type}`] = meal_name;
    });
    setCustomMeals(restored);
  };

  const savePlanToSupabase = async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from("meal_plans")
      .insert([{ user_id: user.id, plan_data: customMeals }]);
    if (error) console.error("❌ Σφάλμα αποθήκευσης:", error.message);
    else alert("✅ Το πλάνο αποθηκεύτηκε!");
  };

  const loadPlanFromSupabase = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("meal_plans")
      .select("plan_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) console.error("❌ Σφάλμα φόρτωσης:", error.message);
    else if (data) setCustomMeals(data.plan_data || {});
  };

  // -------------------------
  // Export / Share
  // -------------------------
  const exportToPDF = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const target = document.body;
    const canvas = await html2canvas(target);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    const today = new Date().toLocaleDateString("el-GR").replaceAll("/", "-");
    pdf.save(`nutrition-plan-${today}.pdf`);
  };

  const exportToCSV = () => {
    const days = [
      "Δευτέρα",
      "Τρίτη",
      "Τετάρτη",
      "Πέμπτη",
      "Παρασκευή",
      "Σάββατο",
      "Κυριακή",
    ];
    const rows = days.map((day) => {
      const breakfast = customMeals[`${day}-breakfast`] || "";
      const lunch = customMeals[`${day}-lunch`] || "";
      const snack = customMeals[`${day}-snack`] || "";
      const dinner = customMeals[`${day}-dinner`] || "";
      return [day, breakfast, lunch, snack, dinner].join(",");
    });
    const csvContent = ["Ημέρα,Πρωινό,Μεσημεριανό,Σνακ,Βραδινό", ...rows].join(
      "\n"
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meal-plan.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const sharePlan = async () => {
    const days = [
      "Δευτέρα",
      "Τρίτη",
      "Τετάρτη",
      "Πέμπτη",
      "Παρασκευή",
      "Σάββατο",
      "Κυριακή",
    ];
    const rows = days
      .map((day) => {
        const breakfast = customMeals[`${day}-breakfast`] || "-";
        const lunch = customMeals[`${day}-lunch`] || "-";
        const snack = customMeals[`${day}-snack`] || "-";
        const dinner = customMeals[`${day}-dinner`] || "-";
        return `${day}:\n🍽️ Πρωινό: ${breakfast}\n🥗 Μεσημεριανό: ${lunch}\n🥚 Σνακ: ${snack}\n🍝 Βραδινό: ${dinner}\n`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(rows);
      alert("📋 Το πλάνο αντιγράφηκε στο πρόχειρο!");
    } catch {
      alert("❌ Σφάλμα κατά την αντιγραφή.");
    }
  };

  const addCustomFood = () => {
    const name = document.getElementById("nf")?.value?.trim();
    const p = parseFloat(document.getElementById("np")?.value);
    const f = parseFloat(document.getElementById("nfat")?.value);
    const c = parseFloat(document.getElementById("nc")?.value);
    if (!name || Number.isNaN(p) || Number.isNaN(f) || Number.isNaN(c)) {
      alert("❌ Παρακαλώ συμπλήρωσε όλα τα πεδία σωστά.");
      return;
    }
    const newFood = { name, protein: p, fat: f, carbs: c };
    setUserFoods((prev) => [...prev, newFood]);
    document.getElementById("nf").value = "";
    document.getElementById("np").value = "";
    document.getElementById("nfat").value = "";
    document.getElementById("nc").value = "";
  };

  // -------------------------
  // Derived / charts data
  // -------------------------
  const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];
  const pieData = [
    { name: "Protein", value: protein * weight },
    { name: "Fat", value: fat * weight },
    { name: "Carbs", value: carbs ? Number(carbs) : 0 },
  ];

  const totalMacros = (() => {
    const totals = { protein: 0, fat: 0, carbs: 0 };
    Object.values(customMeals).forEach((mealName) => {
      const foodItem = allFoodsFull.find((f) => f.name === mealName);
      if (foodItem) {
        totals.protein += Number(foodItem.protein) || 0;
        totals.fat += Number(foodItem.fat) || 0;
        totals.carbs += Number(foodItem.carbs) || 0;
      }
    });
    return totals;
  })();

  const macroBarData = [
    { label: "Πρωτεΐνη", "Στόχος": protein * weight, "Πλάνο": totalMacros.protein },
    { label: "Λίπος", "Στόχος": fat * weight, "Πλάνο": totalMacros.fat },
    { label: "Υδατ.", "Στόχος": Number(carbs || 0), "Πλάνο": totalMacros.carbs },
  ];

  const macroComparisonData = [
    { label: "Στόχος", protein: protein * weight, fat: fat * weight, carbs: Number(carbs || 0) },
    { label: "Πλάνο", protein: totalMacros.protein, fat: totalMacros.fat, carbs: totalMacros.carbs },
  ];

 // ---- THEME TOKENS (Night-mode friendly) ----
const panelClass =
  theme === "dark"
    ? "bg-zinc-900/95 border border-zinc-800 text-zinc-100"
    : "bg-white/95 border border-zinc-200 text-zinc-900";

const sectionStyle = `rounded-2xl p-5 shadow-sm ${panelClass}`;

const inputStyle =
  "w-full rounded border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 " +
  (theme === "dark"
    ? "bg-zinc-900 text-zinc-100 border-zinc-800 placeholder-zinc-500"
    : "bg-white text-zinc-900 border-zinc-300 placeholder-zinc-400");

const rowBg = theme === "dark" ? "bg-zinc-900" : "bg-white";
const rowAltBg = theme === "dark" ? "bg-zinc-950" : "bg-zinc-50";
const headBg = theme === "dark" ? "bg-zinc-800" : "bg-zinc-200";
const borderCol = theme === "dark" ? "border-zinc-800" : "border-zinc-300";
const headText = theme === "dark" ? "text-zinc-100" : "text-zinc-900";
const cellText = theme === "dark" ? "text-zinc-200" : "text-zinc-800";
const softText = theme === "dark" ? "text-zinc-400" : "text-zinc-500";

  // -------------------------
  // UI
  // -------------------------
  return (
    <>
    {!user?.id && (
      <div className="mb-4 rounded border border-yellow-400 bg-yellow-50 text-yellow-800 p-3 text-sm">
        Δεν έχεις συνδεθεί — το πλάνο λειτουργεί τοπικά. Cloud sync/αποθήκευση θα ενεργοποιηθούν μόλις συνδεθείς.
      </div>
    )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className={`min-h-screen px-6 py-10 space-y-10 transition-colors duration-500 ${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
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

        {/* Header */}
        <div className="sticky top-0 z-50 bg-inherit py-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-yellow-400 drop-shadow text-center">
            🧪 Nutrition Lab
          </h1>
          <div className="text-center mt-2">
            <button
              onClick={() => setSimpleView(!simpleView)}
              className="bg-yellow-300 hover:bg-yellow-400 text-black text-sm font-medium px-3 py-1 rounded"
            >
              {simpleView ? "💡 Προηγμένη Έκδοση" : "✨ Απλοποιημένη Έκδοση"}
            </button>
          </div>
        </div>

        {/* Preferences + Reset/Theme */}
        <div className="max-w-xl mx-auto space-y-10">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">
              🎛️ Προτιμήσεις:
              <span
                className="ml-1 text-xs text-gray-500"
                title="Ορίζει το διατροφικό μοτίβο π.χ. vegetarian ή χαμηλό σε υδατάνθρακες"
              >
                ℹ️
              </span>
            </label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className={`p-2 rounded w-full border text-sm ${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-black border-gray-300"
              }`}
            >
              <option value="default">Κανονικό</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="lowcarb">Χαμηλοί Υδατάνθρακες</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                if (window.confirm("Θες σίγουρα να κάνεις επαναφορά όλων;")) {
                  setProtein(2);
                  setFat(1);
                  setPreference("default");
                  setDaysOrder([
                    "Δευτέρα",
                    "Τρίτη",
                    "Τετάρτη",
                    "Πέμπτη",
                    "Παρασκευή",
                    "Σάββατο",
                    "Κυριακή",
                  ]);
                  setCarbs(null);
                  setWeight(70);
                  setHeight(175);
                  setAge(25);
                  setGender("male");
                  setActivity(1.55);
                  setBmr(null);
                  setTdee(null);

                  const inputs = document.querySelectorAll("input");
                  inputs.forEach((input) => (input.value = ""));

                  localStorage.removeItem("protein");
                  localStorage.removeItem("fat");
                  localStorage.removeItem("preference");
                  localStorage.removeItem("daysOrder");
                  localStorage.removeItem("carbs");
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              🔁 Επαναφορά Όλων
            </button>

            <button
              onClick={toggleTheme}
              className="text-2xl hover:text-yellow-400 transition"
              title="Αλλαγή Θέματος"
            >
              {theme === "dark" ? "☀" : "🌙"}
            </button>
          </div>

          {/* BMR / TDEE */}
          <details
            open
            className={`${sectionStyle} ${
              theme === "dark" ? "bg-gray-900" : "bg-yellow-100"
            } rounded-xl p-4 shadow-md transition-all`}
          >
            <summary className="text-xl sm:text-2xl font-semibold cursor-pointer">
              🧮 Υπολογισμός BMR / TDEE
            </summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <label className="block mb-1 font-medium">⚖️ Βάρος (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="π.χ. 70"
                  className={`w-full p-2 rounded border ${inputStyle}`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">📏 Ύψος (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  placeholder="π.χ. 175"
                  className={`w-full p-2 rounded border ${inputStyle}`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">🎂 Ηλικία</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  placeholder="π.χ. 25"
                  className={`w-full p-2 rounded border ${inputStyle}`}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">👤 Φύλο</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`w-full p-2 rounded border ${inputStyle}`}
                >
                  <option value="male">Άνδρας</option>
                  <option value="female">Γυναίκα</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-medium">🏃‍♂️ Επίπεδο δραστηριότητας</label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(Number(e.target.value))}
                  className={`w-full p-2 rounded border ${inputStyle}`}
                >
                  <option value={1.2}>Καθιστική ζωή</option>
                  <option value={1.375}>Ελαφριά δραστηριότητα</option>
                  <option value={1.55}>Μέτρια δραστηριότητα</option>
                  <option value={1.725}>Έντονη δραστηριότητα</option>
                  <option value={1.9}>Πολύ έντονη δραστηριότητα</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-4 items-center mt-2">
                <button
                  onClick={calculateNutrition}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow-sm"
                >
                  🔍 Υπολόγισε
                </button>
                {bmr !== null && tdee !== null && (
                  <p className="mt-2 text-sm">
                    <strong>BMR:</strong> {bmr} kcal | <strong>TDEE:</strong> {tdee} kcal
                  </p>
                )}
              </div>
            </div>
          </details>
        </div>

        {/* Tabs */}
        <TabsCompo
          activeTab="🥗 Γεύματα"
          tabs={["📊 AI Προτάσεις", "🥗 Γεύματα", "📈 Σύγκριση"]}
        />

        {/* Macros & AI Plan */}
        <CollapsibleSection title="🥗 Διατροφικοί Στόχοι (Macros)">
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <button
                onClick={generateMealPlanFromTargets}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
                aria-label="Αυτόματη Δημιουργία Πλάνου"
              >
                🧠 Αυτόματο Εβδομαδιαίο Πλάνο
              </button>
              <span
                className="text-xs text-gray-500"
                title="Χρησιμοποιεί τις τιμές macros και στόχους για να δημιουργήσει εβδομαδιαίο πρόγραμμα γευμάτων"
              >
                ⓘ
              </span>
            </div>

            <MacroSlider
              label="Πρωτεΐνη (g/kg)"
              value={protein}
              setValue={setProtein}
              min={0.5}
              max={3}
              step={0.1}
              tooltip="Πόσα γραμμάρια πρωτεΐνης ανά κιλό βάρους."
              labelFunction={getProteinLabel}
            />

            <MacroSlider
              label="Λίπος (g/kg)"
              value={fat}
              setValue={setFat}
              min={0.3}
              max={2}
              step={0.1}
              tooltip="Πόσα γραμμάρια λίπους ανά κιλό βάρους."
              labelFunction={getFatLabel}
            />

            {carbs !== null && (
              <>
                <p>
                  Πρωτεΐνη: {(protein * weight).toFixed(0)}g | Λίπος:{" "}
                  {(fat * weight).toFixed(0)}g | Υδατάνθρακες:{" "}
                  {Number(carbs).toFixed(0)}g
                </p>
<MacroPieChart pieData={pieData} colors={COLORS} theme={theme === "dark" ? "dark" : "light"} />
              </>
            )}

            <PreferenceSelector
              value={preference}
              onChange={setPreference}
              tooltip="Επιλογή διατροφικής προτίμησης (π.χ. χορτοφαγική, χαμηλών υδατανθράκων)"
            />

            <button
              onClick={handleGenerateAIPlan}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              aria-label="Δημιουργία AI πλάνου"
            >
              🤖 Δημιούργησε AI Πλάνο
            </button>
          </div>
        </CollapsibleSection>

        {/* Plan preview */}
        <CollapsibleSection title="👀 Προεπισκόπηση Πλάνου">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {daysOrder.map((day) => (
              <PlanDayCard
                key={day}
                day={day}
                customMeals={customMeals}
                allFoods={allFoodsFull}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* AI suggestions */}
        <CollapsibleSection title="📊 AI Προτάσεις">
          {tdee !== null && (
            <div className="space-y-4 text-sm">
              <p>
                ⚡ <strong>Συνολικές θερμίδες:</strong> {tdee} kcal
              </p>
              <p>
                🍗 <strong>Πρωτεΐνη:</strong>{" "}
                {(protein * weight).toFixed(0)}g —{" "}
                {protein >= 2
                  ? "υψηλή, ιδανική για μυϊκή ανάπτυξη."
                  : "φυσιολογική ή χαμηλή."}
              </p>
              <p>
                🧈 <strong>Λίπος:</strong> {(fat * weight).toFixed(0)}g —{" "}
                {fat < 0.6 ? "χαμηλό, πρόσεξε." : "ok."}
              </p>
              <p>
                🍞 <strong>Υδατάνθρακες:</strong>{" "}
                {Number(carbs || 0).toFixed(0)}g — ανάλογα με στόχο/προπόνηση.
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* Goal suggestions */}
        <CollapsibleSection title="📈 Προτάσεις Ανά Στόχο">
          {tdee !== null && (
            <div className="space-y-3 text-sm">
              <p>
                🎯 <strong>Cut:</strong> ~15-25% έλλειμμα →{" "}
                {(tdee * 0.75).toFixed(0)} kcal
              </p>
              <p>
                ⚖️ <strong>Maintain:</strong> TDEE → {tdee} kcal
              </p>
              <p>
                💪 <strong>Bulk:</strong> ~10-15% surplus →{" "}
                {(tdee * 1.15).toFixed(0)} kcal
              </p>
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
            const intake = parseInt(intakeKcal);
            if (!isNaN(intake)) {
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
          <div className="mt-4 p-4 rounded bg-white dark:bg-gray-800 border border-yellow-300 text-sm text-yellow-800 dark:text-yellow-200">
            {Math.abs(deltas.protein) > 10 && <p>⚠️ Πρωτεΐνη: {deltas.protein.toFixed(1)}% απόκλιση από στόχο.</p>}
            {Math.abs(deltas.fat) > 10 && <p>⚠️ Λίπος: {deltas.fat.toFixed(1)}% απόκλιση από στόχο.</p>}
            {Math.abs(deltas.carbs) > 10 && <p>⚠️ Υδατάνθρακες: {deltas.carbs.toFixed(1)}% απόκλιση από στόχο.</p>}
            {Math.abs(deltas.protein) <= 10 && Math.abs(deltas.fat) <= 10 && Math.abs(deltas.carbs) <= 10 && (
              <p>✅ Είσαι εντός ±10% σε όλα τα macros.</p>
            )}
          </div>
        );
      })()}
    </div>
  )}
</CollapsibleSection>


        {/* Reorder days + per-day plan builder */}
        <CollapsibleSection title="🥗 Προγραμματισμός Γευμάτων ανά Ημέρα">
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
          {/* THEMED panel */}
          <div className={`rounded-2xl p-3 border ${borderCol} ${theme === "dark" ? "bg-zinc-900/95 text-zinc-100" : "bg-white/95 text-zinc-900"}`}>
            <p className="font-bold text-yellow-400">📅 {day}</p>

            <ul className="space-y-3 mt-3">
              {["breakfast", "lunch", "snack", "dinner"].map((mealType, idx) => {
                const emoji =
                  mealType === "breakfast" ? "🍽️" :
                  mealType === "lunch" ? "🥗" :
                  mealType === "snack" ? "🥚" : "🍝";

                const label =
                  mealType === "breakfast" ? "Πρωινό" :
                  mealType === "lunch" ? "Μεσημεριανό" :
                  mealType === "snack" ? "Σνακ" : "Βραδινό";

                const mealKey = `${day}-${mealType}`;
                const mealName = customMeals[mealKey] || "";
                const food = allFoodsFull.find((f) => f.name === mealName);

                const rowBg = idx % 2 ? (theme === "dark" ? "bg-zinc-950" : "bg-zinc-50") : "";

                return (
                  <li key={mealKey} className={`rounded-xl px-3 py-3 ${rowBg}`}>
                    <div className="text-sm font-semibold">
                      {emoji} {label}
                    </div>

                    <input
                      title="Εισαγωγή ή τροποποίηση γεύματος"
                      className={`w-full mt-2 text-sm rounded px-3 py-2 border ${
                        theme === "dark"
                          ? "bg-zinc-900 text-zinc-100 border-zinc-800 placeholder-zinc-500"
                          : "bg-white text-zinc-900 border-zinc-300 placeholder-zinc-400"
                      }`}
                      value={mealName}
                      onChange={(e) =>
                        setCustomMeals((prev) => ({ ...prev, [mealKey]: e.target.value }))
                      }
                      placeholder="Πληκτρολόγησε γεύμα ή πάτα Αντικατάσταση"
                    />

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        title="Αυτόματη αντικατάσταση από βάση"
                        onClick={() => handleReplacement(day, mealType)}
                      >
                        🔁 Αντικατάσταση
                      </button>

                      {food && (
                        <div
                          className={`ml-auto text-xs rounded px-2 py-1 ${
                            theme === "dark" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          📊 {Number(food.protein)||0}g P / {Number(food.fat)||0}g F / {Number(food.carbs)||0}g C
                        </div>
                      )}
                    </div>

                    {/* Σύνολα/Διαφορές από το τρέχον πλάνο: δείξε τα ΜΟΝΟ στην τελευταία σειρά (dinner) για καθαρό UI */}
                    {mealType === "dinner" && (
                      <div className={`mt-3 rounded-xl px-3 py-2 border ${borderCol} ${theme === "dark" ? "bg-zinc-900/80" : "bg-white/80"}`}>
                        {(() => {
                          const target = {
                            protein: protein * weight,
                            fat: fat * weight,
                            carbs: Number(carbs || 0),
                          };
                          const actual = getTotalMacrosFromPlan();
                          const delta = {
                            protein: actual.protein - target.protein,
                            fat: actual.fat - target.fat,
                            carbs: actual.carbs - target.carbs,
                          };
                          return (
                            <>
                              <div className="text-sm space-y-1">
                                <p>
                                  🎯 Στόχος: {target.protein.toFixed(1)}g P, {target.fat.toFixed(1)}g F, {target.carbs.toFixed(1)}g C
                                </p>
                                <p>
                                  📦 Πλάνο: {actual.protein.toFixed(1)}g P / {actual.fat.toFixed(1)}g F / {actual.carbs.toFixed(1)}g C
                                </p>
                                <p className="text-yellow-400">
                                  ✏️ Διαφορά: {delta.protein.toFixed(1)} P / {delta.fat.toFixed(1)} F / {delta.carbs.toFixed(1)} C
                                </p>
                              </div>
                              <p className="text-yellow-400 mt-1">
                                🔥 Θερμίδες από το πλάνο: {getTotalKcalFromPlan(customMeals)} kcal
                              </p>
                            </>
                          );
                        })()}
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
</CollapsibleSection>


        {/* Summary Tab */}
        <Tabs defaultTab="Σύνολο">
          <Tab label="📊 Σύνολο">
            <CollapsibleSection title="📊 Σύνολο Μακροθρεπτικών από Πλάνο">
              {(() => {
                const target = {
                  protein: protein * weight,
                  fat: fat * weight,
                  carbs: Number(carbs || 0),
                };
                const actual = getTotalMacrosFromPlan();
                const delta = {
                  protein: actual.protein - target.protein,
                  fat: actual.fat - target.fat,
                  carbs: actual.carbs - target.carbs,
                };
                return (
                  <>
                    <div className="text-sm space-y-2">
                      <p>
                        🎯 Στόχος: {target.protein.toFixed(1)}g πρωτεΐνη,{" "}
                        {target.fat.toFixed(1)}g λίπος,{" "}
                        {target.carbs.toFixed(1)}g υδατάνθρακες
                      </p>
                      <p>
                        📦 Πλάνο: {actual.protein.toFixed(1)}g P /{" "}
                        {actual.fat.toFixed(1)}g F / {actual.carbs.toFixed(1)}g
                        C
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        ✏️ Διαφορά: {delta.protein.toFixed(1)} P /{" "}
                        {delta.fat.toFixed(1)} F / {delta.carbs.toFixed(1)} C
                      </p>
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      🔥 Θερμίδες από το πλάνο: {getTotalKcalFromPlan(customMeals)} kcal
                    </p>
                  </>
                );
              })()}
            </CollapsibleSection>

            <div className="flex flex-wrap gap-4 mt-4 sticky top-0 z-10 bg-opacity-80 backdrop-blur border-b py-2 px-2">
              <button
  onClick={saveMealsToSupabase}
  disabled={!user?.id}
  className="bg-green-500 px-3 py-1 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
  title={user?.id ? "Αποθήκευση των γευμάτων στο cloud" : "Συνδέσου για cloud αποθήκευση"}
>
  ☁️ Αποθήκευση στο Cloud
</button>

<button
  onClick={loadMealsFromSupabase}
  disabled={!user?.id}
  className="bg-blue-500 px-3 py-1 rounded text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
  title={user?.id ? "Φόρτωση γευμάτων από το cloud" : "Συνδέσου για cloud φόρτωση"}
>
  🔄 Φόρτωση από Cloud
</button>

<button
  onClick={savePlanToSupabase}
  disabled={!user?.id}
  className="bg-green-600 text-white px-4 py-2 rounded ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
  title={user?.id ? "Αποθήκευση πλάνου στον server" : "Συνδέσου για αποθήκευση"}
>
  💾 Αποθήκευση
</button>

<button
  onClick={loadPlanFromSupabase}
  disabled={!user?.id}
  className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
  title={user?.id ? "Φόρτωση πλάνου από τον server" : "Συνδέσου για φόρτωση"}
>
  ☁️ Φόρτωση
</button>

            </div>

            <CollapsibleSection title="👁️ Προεπισκόπηση Εβδομαδιαίου Πλάνου">
              <div className="space-y-4 text-sm">
                {daysOrder.map((day) => (
                  <div key={day} className="p-4 border border-yellow-300 rounded">
                    <h3 className="font-bold text-yellow-600 dark:text-yellow-300 mb-2">
                      📅 {day}
                    </h3>
                    <ul className="space-y-1">
                      {["breakfast", "lunch", "snack", "dinner"].map((mealType) => {
                        const mealName = customMeals[`${day}-${mealType}`] || "-";
                        return (
                          <li
                            key={`${day}-${mealType}`}
                            className="flex justify-between border-b dark:border-gray-700 pb-1"
                          >
                            <span className="capitalize">
                              {mealType === "breakfast" && "🍽️ Πρωινό:"}
                              {mealType === "lunch" && "🥗 Μεσημεριανό:"}
                              {mealType === "snack" && "🥚 Σνακ:"}
                              {mealType === "dinner" && "🍝 Βραδινό:"}
                            </span>
                            <span className="text-right font-medium text-gray-700 dark:text-gray-200">
                              {mealName}
                            </span>
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

                const totalKcal =
                  total.protein * 4 + total.carbs * 4 + total.fat * 9;

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

        {/* Export / Share */}
        <CollapsibleSection title="📤 Κατέβασε Πλάνο">
          <div className="flex flex-wrap gap-2 mt-2 text-sm">
            <button
              onClick={exportToPDF}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              📄 PDF
            </button>
            <button
              onClick={exportToCSV}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              📑 CSV
            </button>
            <button
              onClick={sharePlan}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              📤 Κοινοποίηση
            </button>
          </div>
        </CollapsibleSection>

        {/* Intake history chart */}
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
    <XAxis dataKey="date" stroke={theme === "dark" ? "#a1a1aa" : "#4b5563"} tick={{ fontSize: 12 }} />
    <YAxis stroke={theme === "dark" ? "#a1a1aa" : "#4b5563"} tick={{ fontSize: 12 }} />

    <Tooltip
      contentStyle={{
        background: theme === "dark" ? "#18181b" : "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
      }}
      labelStyle={{ color: theme === "dark" ? "#e4e4e7" : "#111827" }}
      formatter={(v) => [`${v} kcal`, "Θερμίδες"]}
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
    />
  </LineChart>
</ResponsiveContainer>
          </CollapsibleSection>
        )}

        {/* Foods tab */}
        <Tabs defaultTab="🥫 Τρόφιμα">
          <Tab label="🥫 Τρόφιμα">
            <CollapsibleSection title="🍽️ Προσθήκη Τροφίμων">
              <input
                type="text"
                placeholder="Αναζήτησε τρόφιμο..."
                className={`p-2 w-full rounded ${inputStyle}`}
                onChange={(e) => setFoodSearch(e.target.value)}
              />
             <div className="grid grid-cols-5 gap-2 text-xs mb-4 mt-2">
  <input
    placeholder="Όνομα"
    className={inputStyle}
    value={newFood.name}
    onChange={(e) => setNewFood((s) => ({ ...s, name: e.target.value }))}
  />
  <input
    placeholder="P"
    className={inputStyle}
    type="number"
    value={newFood.protein}
    onChange={(e) => setNewFood((s) => ({ ...s, protein: e.target.value }))}
  />
  <input
    placeholder="F"
    className={inputStyle}
    type="number"
    value={newFood.fat}
    onChange={(e) => setNewFood((s) => ({ ...s, fat: e.target.value }))}
  />
  <input
    placeholder="C"
    className={inputStyle}
    type="number"
    value={newFood.carbs}
    onChange={(e) => setNewFood((s) => ({ ...s, carbs: e.target.value }))}
  />
  <button
    className="bg-green-500 text-white px-2 py-1 rounded"
    onClick={() => {
      const name = newFood.name.trim();
      const p = parseFloat(newFood.protein);
      const f = parseFloat(newFood.fat);
      const c = parseFloat(newFood.carbs);
      if (!name || isNaN(p) || isNaN(f) || isNaN(c)) {
        alert("❌ Παρακαλώ συμπλήρωσε όλα τα πεδία σωστά.");
        return;
      }
      setUserFoods((prev) => [...prev, { name, protein: p, fat: f, carbs: c }]);
      setNewFood({ name: "", protein: "", fat: "", carbs: "" });
    }}
  >
    ➕ Προσθήκη
  </button>
</div>

            </CollapsibleSection>

            <CollapsibleSection title="🗓️ Αντιστοίχιση Γευμάτων">
              <div className="flex gap-2 mb-4">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`p-2 rounded ${inputStyle}`}
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
                >
                  <option value="breakfast">Πρωινό</option>
                  <option value="lunch">Μεσημεριανό</option>
                  <option value="snack">Σνακ</option>
                  <option value="dinner">Βραδινό</option>
                </select>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="📦 Λίστα Τροφίμων (user + default)">
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
        {/* USER FOODS */}
        {userFoods.map((item, i) => {
          const p = toNum(item.protein);
          const f = toNum(item.fat);
          const c = toNum(item.carbs);
          const odd = i % 2 === 1;
          return (
            <tr
              key={`u-${i}`}
              className={`${odd ? rowAltBg : rowBg} border-t ${borderCol}`}
            >
              <td className="p-2">{item.name}</td>
              <td className="p-2 text-right">{fmtG(p)}</td>
              <td className="p-2 text-right">{fmtG(f)}</td>
              <td className="p-2 text-right">{fmtG(c)}</td>
              <td className="p-2 text-right">{kcalOf({ protein: p, fat: f, carbs: c })}</td>
              <td className="p-2">
                <div className="flex gap-1 justify-center">
                  <button
                    className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500"
                    title="Προσθήκη στο Πλάνο"
                    onClick={() => {
                      const mealKey = `${selectedDay}-${selectedMealType}`;
                      setCustomMeals((prev) => ({ ...prev, [mealKey]: item.name }));
                    }}
                  >
                    ➕ Στο Πλάνο
                  </button>
                  <button
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    title="Επεξεργασία Τροφίμου"
                    onClick={() => {
                      const newName = prompt("✏️ Νέο όνομα:", item.name);
                      const newProtein = Number(prompt("Πρωτεΐνη (g):", p));
                      const newFat = Number(prompt("Λίπος (g):", f));
                      const newCarbs = Number(prompt("Υδατάνθρακες (g):", c));
                      if (!newName || !Number.isFinite(newProtein) || !Number.isFinite(newFat) || !Number.isFinite(newCarbs)) return;
                      const updated = [...userFoods];
                      updated[i] = { name: newName, protein: newProtein, fat: newFat, carbs: newCarbs };
                      setUserFoods(updated);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    title="Διαγραφή Τροφίμου"
                    onClick={() => {
                      const updated = [...userFoods];
                      updated.splice(i, 1);
                      setUserFoods(updated);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          );
        })}

        {/* DEFAULT + FILTERED FOODS */}
        {filteredFoods.map((item, i) => {
          const p = toNum(item.protein);
          const f = toNum(item.fat);
          const c = toNum(item.carbs);
          const odd = (userFoods.length + i) % 2 === 1;
          return (
            <tr
              key={`f-${i}`}
              className={`${odd ? rowAltBg : rowBg} border-t ${borderCol}`}
            >
              <td className="p-2">{item.name}</td>
              <td className="p-2 text-right">{fmtG(p)}</td>
              <td className="p-2 text-right">{fmtG(f)}</td>
              <td className="p-2 text-right">{fmtG(c)}</td>
              <td className="p-2 text-right">{kcalOf({ protein: p, fat: f, carbs: c })}</td>
              <td className="p-2 text-center">
                <button
                  className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500"
                  title="Προσθήκη στο Πλάνο"
                  onClick={() => {
                    const mealKey = `${selectedDay}-${selectedMealType}`;
                    setCustomMeals((prev) => ({ ...prev, [mealKey]: item.name }));
                  }}
                >
                  ➕ Στο Πλάνο
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</CollapsibleSection>

          </Tab>
        </Tabs>

        {/* Comparison charts */}
        <CollapsibleSection title="📊 Σύγκριση Μακροθρεπτικών">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <MacroComparisonChart
  data={macroComparisonData}
  colors={COLORS}
  tooltipFormatter={(value) => `${value}g`}
  theme={theme === "dark" ? "dark" : "light"}
/>

<MacroBarChart
  data={macroBarData}
  colors={COLORS}
  tooltipFormatter={(value) => `${value}g`}
  theme={theme === "dark" ? "dark" : "light"}
/>

          </div>
        </CollapsibleSection>
      </motion.div>
    </>
  );
}
