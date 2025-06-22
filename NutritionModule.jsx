import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "./supabaseClient";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser, SignedIn } from "@clerk/clerk-react";
import { useTheme } from "./ThemeContext";
import defaultMeals from './defaultMeals.json';
import CollapsibleSection from "./CollapsibleSection";
import MacroSlider from "./MacroSlider";
import MacroPieChart from "./MacroPieChart";
import PreferenceSelector from "./PreferenceSelector";
import PlanDayCard from "./PlanDayCard";
import { Tabs, Tab } from "./TabsComponent";
import TabsCompo from "./TabsCompo";
import MacroComparisonChart from "./MacroComparisonChart";
import MacroBarChart from "./MacroBarChart";

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "0.25rem"
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
  const [simpleView, setSimpleView] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [foodSearch, setFoodSearch] = useState("");
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState(1.55);
  const [bmr, setBmr] = useState(null);
  const [tdee, setTdee] = useState(null);
  const [protein, setProtein] = useState(() => parseFloat(localStorage.getItem("protein")) || 2);
  const [fat, setFat] = useState(() => parseFloat(localStorage.getItem("fat")) || 1);
  const [carbs, setCarbs] = useState(() => {
    const saved = localStorage.getItem("carbs");
    return saved ? parseFloat(saved) : null;
  });
  const [intakeHistory, setIntakeHistory] = useState([]);
  const [preference, setPreference] = useState(() => localStorage.getItem("preference") || "default");
  const [daysOrder, setDaysOrder] = useState(() => {
    const saved = localStorage.getItem("daysOrder");
    return saved ? JSON.parse(saved) : [
      'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'
    ];
  });
  const [customMeals, setCustomMeals] = useState(() => {
    const saved = localStorage.getItem("customMeals");
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedFood, setSelectedFood] = useState({ name: "", protein: 0, fat: 0, carbs: 0 });
  const [selectedName, setSelectedName] = useState("");
  const [selectedDay, setSelectedDay] = useState(daysOrder[0]);
  const [selectedMealType, setSelectedMealType] = useState("snack");
  const [userFoods, setUserFoods] = useState(() => {
    const saved = localStorage.getItem("userFoods");
    return saved ? JSON.parse(saved) : [];
  });

  const foodDB = useMemo(() => [
    { name: "Αβγό", protein: 6, fat: 5, carbs: 0.5 },
    { name: "Κοτόπουλο (100g)", protein: 31, fat: 3.6, carbs: 0 },
    { name: "Ρύζι (100g μαγειρεμένο)", protein: 2.7, fat: 0.3, carbs: 28 },
    { name: "Μπανάνα", protein: 1.3, fat: 0.3, carbs: 27 },
    { name: "Γιαούρτι 2% (100g)", protein: 10, fat: 2, carbs: 4 },
    { name: "Φακές (μαγειρεμένες)", protein: 9, fat: 0.4, carbs: 20 },
    { name: "Τοφού", protein: 8, fat: 4.8, carbs: 1.9 },
    { name: "Σολωμός (100g)", protein: 20, fat: 13, carbs: 0 },
    { name: "Ψωμί ολικής (φέτα)", protein: 4, fat: 1, carbs: 12 },
    { name: "Αμύγδαλα (10τμχ)", protein: 2.5, fat: 5.5, carbs: 2 }
  ], []);

  const allFoods = useMemo(() => [...foodDB, ...defaultMeals, ...userFoods], [foodDB, defaultMeals, userFoods]);

  const filteredFoods = useMemo(() =>
    allFoods.filter((item) =>
      item.name.toLowerCase().includes(foodSearch.toLowerCase())
    ), [foodSearch, allFoods]
  );

  const exampleMealName = "Κοτόπουλο (100g)";
  const meal = useMemo(() => allFoods.find(m => m.name === exampleMealName), [allFoods]);
  const food = useMemo(() => allFoods.find(f => f.name === exampleMealName), [allFoods]);
  const mealExists = useMemo(() => allFoods.some(m => m.name === selectedName), [allFoods, selectedName]);
  const proteinNames = useMemo(() => allFoods.map(f => f.protein), [allFoods]);
  const customFiltered = useMemo(() => allFoods.filter(f => f.category === 'custom'), [allFoods]);
  const isIncluded = useMemo(() => allFoods.some(f => f.name === selectedFood.name), [allFoods, selectedFood]);

  useEffect(() => {
  localStorage.setItem("userFoods", JSON.stringify(userFoods));
}, [userFoods]);

useEffect(() => {
    localStorage.setItem("protein", protein);
  }, [protein]);

  useEffect(() => {
    localStorage.setItem("fat", fat);
  }, [fat]);

  useEffect(() => {
    if (carbs !== null) {
      localStorage.setItem("carbs", carbs);
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

  useEffect(() => {
    localStorage.setItem("userFoods", JSON.stringify(userFoods));
  }, [userFoods]);


useEffect(() => {
    const names = allFoods.map(f => f.name);
    console.log('✅ Available Foods:', names.slice(0, 5));
  }, [allFoods]);

  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemPrefersDark && theme !== 'dark') toggleTheme();
    if (!systemPrefersDark && theme === 'dark') toggleTheme();
  }, []);
 
  const getProteinLabel = (value) => {
    if (value < 1.2) return "Χαμηλή πρόσληψη πρωτεΐνης (π.χ. καθιστικοί ενήλικες)";
    if (value < 2) return "Μέτρια πρόσληψη πρωτεΐνης (π.χ. fitness / υγιεινή διατροφή)";
    return "Υψηλή πρόσληψη πρωτεΐνης (π.χ. bodybuilding, εντατική άσκηση)";
  };

  const getFatLabel = (value) => {
    if (value < 0.6) return "Πολύ χαμηλά λιπαρά (προσοχή σε έλλειψη απαραίτητων λιπαρών οξέων)";
    if (value < 1.2) return "Μέτρια λιπαρά (ισορροπημένη διατροφή)";
    return "Υψηλή πρόσληψη λιπαρών (πιθανή αύξηση θερμιδικής πρόσληψης)";
  };

  const calculateNutrition = () => {
    const calculatedBmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;
    const calculatedTdee = calculatedBmr * activity;
    setBmr(calculatedBmr.toFixed(1));
    setTdee(calculatedTdee.toFixed(1));

    const kcalFromProtein = protein * weight * 4;
    const kcalFromFat = fat * weight * 9;
    const remainingKcal = calculatedTdee - (kcalFromProtein + kcalFromFat);
    const gCarbs = remainingKcal / 4;
    setCarbs(gCarbs.toFixed(1));
  };

  const inputStyle = `w-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
    theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
  }`;

  const sectionStyle = "bg-opacity-30 backdrop-blur-sm p-6 rounded-xl shadow-lg";

  const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];
  const pieData = [
    { name: "Protein", value: protein * weight },
    { name: "Fat", value: fat * weight },
    { name: "Carbs", value: carbs ? parseFloat(carbs) : 0 }
  ];

 useEffect(() => {
     if (!tdee || !protein || !fat || !carbs || !user?.id) return;
    const syncToSupabase = async () => {
      const { data, error } = await supabase
        .from("nutrition_data")
        .upsert({
          user_id: user.id,
          week: 1,
          bmr: parseFloat(bmr),
          vo2: null,
          protein: protein * weight,
          carbs: parseFloat(carbs),
          fat: fat * weight,
          stress_monday: null,
          stress_tuesday: null
        });

      if (error) {
        console.error("❌ Supabase sync error:", error.message);
      } else {
        console.log("✅ Supabase sync success:", data);
      }
    };

     const logDailyIntake = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("intake_logs").upsert({
        user_id: user.id,
        date: today,
        kcal: parseFloat(tdee),
        protein: protein * weight,
        carbs: parseFloat(carbs),
        fat: fat * weight
      });
      if (error) console.error("❌ Intake log error:", error.message);
      else console.log("📅 Intake logged successfully");
    };

    syncToSupabase();
    logDailyIntake();

    const fetchIntakeHistory = async () => {
      const { data, error } = await supabase
        .from("intake_logs")
        .select("date, kcal")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (!error && data) {
        setIntakeHistory(data);
      }
    };
    fetchIntakeHistory();
  }, [protein, fat, carbs, bmr, tdee, weight]);
  


  const mealOptions = {
  breakfast: [
    { name: "Βρώμη με γάλα και μπανάνα", protein: 12, fat: 6, carbs: 45 },
    { name: "Αβγά με τοστ ολικής", protein: 18, fat: 12, carbs: 20 },
    { name: "Smoothie με πρωτεΐνη και μούρα", protein: 25, fat: 3, carbs: 15 },
    { name: "Γιαούρτι με μέλι και καρύδια", protein: 15, fat: 8, carbs: 20 }
  ],
  lunch: [
    { name: "Κοτόπουλο με ρύζι και μπρόκολο", protein: 35, fat: 5, carbs: 50 },
    { name: "Τοφού stir-fry με λαχανικά", protein: 25, fat: 10, carbs: 30 },
    { name: "Μοσχάρι με πατάτες φούρνου", protein: 30, fat: 15, carbs: 40 },
    { name: "Φακές με καστανό ρύζι", protein: 20, fat: 4, carbs: 55 }
  ],
  snack: [
    { name: "Γιαούρτι με φρούτα", protein: 10, fat: 4, carbs: 15 },
    { name: "Protein bar", protein: 20, fat: 5, carbs: 20 },
    { name: "Αμύγδαλα και μήλο", protein: 6, fat: 9, carbs: 22 },
    { name: "Βραστό αυγό με φρυγανιά", protein: 8, fat: 6, carbs: 14 }
  ],
  dinner: [
    { name: "Ψάρι με κους κους", protein: 28, fat: 8, carbs: 35 },
    { name: "Ομελέτα με λαχανικά", protein: 22, fat: 10, carbs: 10 },
    { name: "Κινόα με φασόλια", protein: 18, fat: 6, carbs: 40 },
    { name: "Ρεβύθια με καρότο και πατάτα", protein: 20, fat: 5, carbs: 45 }
  ]
};

  const getRandomMeal = (type) => {
  const meals = mealOptions[type];
  const filteredMeals = meals.filter((meal) => {
    if (preference === "vegetarian") return !meal.name.toLowerCase().includes("κοτόπουλο") && !meal.name.toLowerCase().includes("μοσχάρι") && !meal.name.toLowerCase().includes("ψάρι") && !meal.name.toLowerCase().includes("αβγά");
    if (preference === "lowcarb") return meal.carbs < 20;
    return true;
  });
  const pool = filteredMeals.length > 0 ? filteredMeals : meals;
  return pool[Math.floor(Math.random() * pool.length)];
};

const totalMealMacros = () => {
  let totals = { protein: 0, fat: 0, carbs: 0 };
  daysOrder.forEach((day) => {
    ["breakfast", "lunch", "snack", "dinner"].forEach((mealType) => {
      const name = customMeals[`${day}-${mealType}`];
      const match = mealOptions[mealType]?.find(m => m.name === name);
      if (match) {
        totals.protein += match.protein;
        totals.fat += match.fat;
        totals.carbs += match.carbs;
      }
    });
  });
  return totals;
};

  const handleReplacement = (day, mealType) => {
  const currentMeal = customMeals[`${day}-${mealType}`];
  const allMeals = [...mealOptions[mealType], ...userFoods];
  const current = allMeals.find((m) => m.name === currentMeal);
  if (!current) return;
  const alternatives = allMeals.filter((m) => {
    const diff = (a, b) => Math.abs(a - b) / (b || 1);
    return (
      diff(m.protein, current.protein) < 0.2 &&
      diff(m.fat, current.fat) < 0.2 &&
      diff(m.carbs, current.carbs) < 0.2 &&
      m.name !== current.name
    );
  });
  if (alternatives.length > 0) {
    const alt = alternatives[Math.floor(Math.random() * alternatives.length)];
    setCustomMeals({ ...customMeals, [`${day}-${mealType}`]: alt.name });
  } else {
    alert("❌ Δεν βρέθηκαν ισοδύναμες επιλογές (με userFoods συμπεριλαμβανομένα).");
  }
};

const generateMealPlanFromTargets = () => {
  if (preference === "lowcarb") {
  filtered = filtered.filter((item) => item.carbs < 15);
} else if (preference === "vegetarian") {
  filtered = filtered.filter((item) =>
    !["κοτόπουλο", "ψάρι", "μοσχάρι", "αυγό"].some(meat => item.name.toLowerCase().includes(meat))
  );
}

  const target = {
    protein: protein * weight,
    fat: fat * weight,
    carbs: parseFloat(carbs)
  };
  const newPlan = {};

  daysOrder.forEach((day) => {
    ["breakfast", "lunch", "snack", "dinner"].forEach((mealType) => {
      const pool = mealOptions[mealType];
      let bestFit = pool[0];
      let smallestDiff = Infinity;

      for (const meal of pool) {
        const diff =
          Math.abs(meal.protein - target.protein / 7 / 4) +
          Math.abs(meal.fat - target.fat / 7 / 4) +
          Math.abs(meal.carbs - target.carbs / 7 / 4);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          bestFit = meal;
        }
      }
      newPlan[`${day}-${mealType}`] = bestFit.name;
    });
  });
  setCustomMeals(newPlan);
};
  
const getTotalMacrosFromPlan = () => {
  let totals = { protein: 0, fat: 0, carbs: 0 };

  daysOrder.forEach((day) => {
    ["breakfast", "lunch", "snack", "dinner"].forEach((mealType) => {
      const name = customMeals[`${day}-${mealType}`];
      const meal = [...foodDB, ...userFoods].find(m => m.name === name);
      if (meal) {
        totals.protein += meal.protein;
        totals.fat += meal.fat;
        totals.carbs += meal.carbs;
      }
    });
  });

  return totals;
};

  const getTotalKcalFromPlan = (meals, foodDB, userFoods) => {
  let totalKcal = 0;
  Object.entries(meals).forEach(([key, name]) => {
    const found = [...foodDB, ...userFoods].find((item) => item.name === name);
    if (found) {
      totalKcal += found.protein * 4 + found.fat * 9 + found.carbs * 4;
    }
  });
  return Math.round(totalKcal);
};

function generateWeeklyMealPlan({ kcal, protein, fat, carbs, preference, foodDB }) {
  const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];

  const splitPerMeal = (val) => Math.round(val / 4); // 4 γεύματα: πρωινό, μεσημεριανό, σνακ, βραδινό

  const macroPerMeal = {
    protein: splitPerMeal(protein),
    fat: splitPerMeal(fat),
    carbs: splitPerMeal(carbs),
  };

  const filterByPreference = (item) => {
    if (preference === "vegetarian") return item.tags?.includes("vegetarian");
    if (preference === "lowcarb") return item.carbs < 15;
    return true;
  };

  const validFoods = foodDB.filter(filterByPreference);

  const getMeal = () => {
    const options = validFoods.filter(
      (f) =>
        Math.abs(f.protein - macroPerMeal.protein) <= 5 &&
        Math.abs(f.fat - macroPerMeal.fat) <= 5 &&
        Math.abs(f.carbs - macroPerMeal.carbs) <= 10
    );
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
  const plan = generateWeeklyMealPlan({
    kcal,
    protein,
    fat,
    carbs,
    preference,
    foodDB,
  });

  setWeeklyPlan(plan); // αποθήκευση σε state
};

const getDayMacroSummary = (dayKey, customMeals, foodDB, userFoods) => {
  const mealNames = Object.entries(customMeals)
    .filter(([key]) => key.startsWith(dayKey))
    .map(([_, value]) => value);

  const allFoods = [...foodDB, ...userFoods];

  let total = { protein: 0, fat: 0, carbs: 0 };

  mealNames.forEach((meal) => {
    const food = allFoods.find((f) => f.name === meal);
    if (food) {
      total.protein += food.protein;
      total.fat += food.fat;
      total.carbs += food.carbs;
    }
  });

  return total;
};
  
const saveMealsToSupabase = async () => {
  const { data: user } = await getUser();
  if (!user) return;

  const entries = Object.entries(customMeals).map(([key, meal_name]) => {
    const [day, meal_type] = key.split("-");
    return {
      user_id: user.id,
      day,
      meal_type,
      meal_name,
    };
  });

  await supabase
    .from("meals")
    .delete()
    .eq("user_id", user.id); // καθαρίζει τα παλιά

  const { error } = await supabase.from("meals").insert(entries);
  if (error) console.error("❌ Error saving meals:", error);
  else console.log("✅ Meals saved successfully!");
};

const loadMealsFromSupabase = async () => {
  const { data: user } = await getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    console.error("❌ Error loading meals:", error);
    return;
  }

  const restored = {};
  data.forEach(({ day, meal_type, meal_name }) => {
    restored[`${day}-${meal_type}`] = meal_name;
  });

  setCustomMeals(restored);
};

const savePlanToSupabase = async () => {
  const { user } = useUser();
  const { data, error } = await supabase
    .from("meal_plans")
    .insert([{ user_id: user.id, plan_data: customMeals }]);

  if (error) {
    console.error("❌ Σφάλμα αποθήκευσης:", error.message);
  } else {
    alert("✅ Το πλάνο αποθηκεύτηκε!");
  }
};

const loadPlanFromSupabase = async () => {
  const { user } = useUser();
  const { data, error } = await supabase
    .from("meal_plans")
    .select("plan_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("❌ Σφάλμα φόρτωσης:", error.message);
  } else if (data) {
    setCustomMeals(data.plan_data);
  }
};

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
  const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];

  const rows = days.map(day => {
    const breakfast = customMeals[`${day}-breakfast`] || "";
    const lunch = customMeals[`${day}-lunch`] || "";
    const snack = customMeals[`${day}-snack`] || "";
    const dinner = customMeals[`${day}-dinner`] || "";
    return [day, breakfast, lunch, snack, dinner].join(",");
  });

  const csvContent = ["Ημέρα,Πρωινό,Μεσημεριανό,Σνακ,Βραδινό", ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "meal-plan.csv");
  link.click();
};

const sharePlan = async () => {
  const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];

  const rows = days.map(day => {
    const breakfast = customMeals[`${day}-breakfast`] || "-";
    const lunch = customMeals[`${day}-lunch`] || "-";
    const snack = customMeals[`${day}-snack`] || "-";
    const dinner = customMeals[`${day}-dinner`] || "-";
    return `${day}:\n🍽️ Πρωινό: ${breakfast}\n🥗 Μεσημεριανό: ${lunch}\n🥚 Σνακ: ${snack}\n🍝 Βραδινό: ${dinner}\n`;
  }).join("\n");

  try {
    await navigator.clipboard.writeText(rows);
    alert("📋 Το πλάνο αντιγράφηκε στο πρόχειρο!");
  } catch (err) {
    alert("❌ Σφάλμα κατά την αντιγραφή.");
  }
};

const addCustomFood = () => {
  const name = document.getElementById("nf")?.value?.trim();
  const protein = parseFloat(document.getElementById("np")?.value);
  const fat = parseFloat(document.getElementById("nfat")?.value);
  const carbs = parseFloat(document.getElementById("nc")?.value);

  if (!name || isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
    alert("❌ Παρακαλώ συμπλήρωσε όλα τα πεδία σωστά.");
    return;
  }

  const newFood = { name, protein, fat, carbs };
  setUserFoods(prev => [...prev, newFood]);

  // Reset fields
  document.getElementById("nf").value = "";
  document.getElementById("np").value = "";
  document.getElementById("nfat").value = "";
  document.getElementById("nc").value = "";
};

const totalMacros = {
  protein: 0,
  fat: 0,
  carbs: 0,
};

Object.values(customMeals).forEach((mealName) => {
  const foodItem = allFoods.find((f) => f.name === mealName);
  if (foodItem) {
    totalMacros.protein += parseFloat(foodItem.protein);
    totalMacros.fat += parseFloat(foodItem.fat);
    totalMacros.carbs += parseFloat(foodItem.carbs);
  }
});

const macroBarData = [
  {
    label: "Πρωτεΐνη",
    "Στόχος": protein * weight,
    "Πλάνο": totalMacros.protein,
  },
  {
    label: "Λίπος",
    "Στόχος": fat * weight,
    "Πλάνο": totalMacros.fat,
  },
  {
    label: "Υδατ.",
    "Στόχος": carbs,
    "Πλάνο": totalMacros.carbs,
  },
];

const macroComparisonData = [
  {
    label: "Στόχος",
    protein: protein * weight,
    fat: fat * weight,
    carbs: parseFloat(carbs),
  },
  {
    label: "Πλάνο",
    protein: totalMacros.protein,
    fat: totalMacros.fat,
    carbs: totalMacros.carbs,
  },
];

  return (
    <SignedIn>
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

    <div className="sticky top-0 z-50 bg-inherit py-4">
      <h1 className="text-4xl font-extrabold tracking-tight text-yellow-400 drop-shadow text-center">
        🧪 Nutrition Lab
      </h1>
      <div className="text-center mt-2">
        <button onClick={() => setSimpleView(!simpleView)} className="bg-yellow-300 hover:bg-yellow-400 text-black text-sm font-medium px-3 py-1 rounded">
          {simpleView ? "💡 Προηγμένη Έκδοση" : "✨ Απλοποιημένη Έκδοση"}
        </button>
      </div>
    </div>

    <div className="max-w-xl mx-auto space-y-10">
      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium">🎛️ Προτιμήσεις:
          <span className="ml-1 text-xs text-gray-500" title="Ορίζει το διατροφικό μοτίβο π.χ. vegetarian ή χαμηλό σε υδατάνθρακες">ℹ️</span>
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

      <details open className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"} rounded-xl p-4 shadow-md transition-all`}> 
  <summary className="text-xl sm:text-2xl font-semibold cursor-pointer">🧮 Υπολογισμός BMR / TDEE</summary>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
    <div>
      <label className="block mb-1 font-medium">⚖️ Βάρος (kg)</label>
      <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="π.χ. 70" className={`w-full p-2 rounded border ${inputStyle}`} />
    </div>

    <div>
      <label className="block mb-1 font-medium">📏 Ύψος (cm)</label>
      <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="π.χ. 175" className={`w-full p-2 rounded border ${inputStyle}`} />
    </div>

    <div>
      <label className="block mb-1 font-medium">🎂 Ηλικία</label>
      <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="π.χ. 25" className={`w-full p-2 rounded border ${inputStyle}`} />
    </div>

    <div>
      <label className="block mb-1 font-medium">👤 Φύλο</label>
      <select value={gender} onChange={(e) => setGender(e.target.value)} className={`w-full p-2 rounded border ${inputStyle}`}>
        <option value="male">Άνδρας</option>
        <option value="female">Γυναίκα</option>
      </select>
    </div>

    <div className="sm:col-span-2">
      <label className="block mb-1 font-medium">🏃‍♂️ Επίπεδο δραστηριότητας</label>
      <select value={activity} onChange={(e) => setActivity(Number(e.target.value))} className={`w-full p-2 rounded border ${inputStyle}`}>
        <option value={1.2}>Καθιστική ζωή</option>
        <option value={1.375}>Ελαφριά δραστηριότητα</option>
        <option value={1.55}>Μέτρια δραστηριότητα</option>
        <option value={1.725}>Έντονη δραστηριότητα</option>
        <option value={1.9}>Πολύ έντονη δραστηριότητα</option>
      </select>
    </div>

    <div className="sm:col-span-2 flex flex-wrap gap-4 items-center mt-2">
      <button onClick={calculateNutrition} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow-sm">
        🔍 Υπολόγισε
      </button>
      {bmr && tdee && (
        <p className="mt-2 text-sm">
          <strong>BMR:</strong> {bmr} kcal | <strong>TDEE:</strong> {tdee} kcal
        </p>
      )}
    </div>
  </div>
</details>
</div>

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

<TabsCompo activeTab="🥗 Γεύματα" tabs={["📊 AI Προτάσεις", "🥗 Γεύματα", "📈 Σύγκριση"]} />

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
      <span className="text-xs text-gray-500" title="Χρησιμοποιεί τις τιμές macros και στόχους για να δημιουργήσει εβδομαδιαίο πρόγραμμα γευμάτων">
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

    {carbs && (
      <>
        <p>
          Πρωτεΐνη: {protein * weight}g | Λίπος: {fat * weight}g | Υδατάνθρακες: {carbs}g
        </p>
        <MacroPieChart pieData={pieData} colors={COLORS} />
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

<CollapsibleSection title="👀 Προεπισκόπηση Πλάνου">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {daysOrder.map((day) => (
      <PlanDayCard key={day} day={day} customMeals={customMeals} allFoods={allFoods} />
    ))}
  </div>
</CollapsibleSection>

<CollapsibleSection title="📊 AI Προτάσεις">
  {tdee && (
    <div className="space-y-4 text-sm">
      <p>⚡ <strong>Συνολικές θερμίδες:</strong> {tdee} kcal</p>
      <p>🍗 <strong>Πρωτεΐνη:</strong> {(protein * weight).toFixed(0)}g — {protein >= 2 ? "υψηλή, ιδανική για μυϊκή ανάπτυξη." : "φυσιολογική ή χαμηλή."}</p>
      <p>🧈 <strong>Λίπος:</strong> {(fat * weight).toFixed(0)}g — {fat < 0.6 ? "χαμηλό, πρόσεξε." : "ok."}</p>
      <p>🍞 <strong>Υδατάνθρακες:</strong> {carbs}g — ανάλογα με στόχο/προπόνηση.</p>
    </div>
  )}
</CollapsibleSection>

<CollapsibleSection title="📈 Προτάσεις Ανά Στόχο">
  {tdee && (
    <div className="space-y-3 text-sm">
      <p>🎯 <strong>Cut:</strong> ~15-25% έλλειμμα → {(tdee * 0.75).toFixed(0)} kcal</p>
      <p>⚖️ <strong>Maintain:</strong> TDEE → {tdee} kcal</p>
      <p>💪 <strong>Bulk:</strong> ~10-15% surplus → {(tdee * 1.15).toFixed(0)} kcal</p>
    </div>
  )}
</CollapsibleSection>

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

<TabsCompo activeTab="📊 AI Προτάσεις" tabs={["📊 AI Προτάσεις", "🥗 Γεύματα", "📈 Σύγκριση"]} />

<CollapsibleSection title="📊 AI Meal Plan Προτάσεις">
  <div className="mt-4 p-4 rounded bg-white dark:bg-gray-800 border border-yellow-400 text-sm text-yellow-800 dark:text-yellow-200 space-y-2">
    {protein * weight < 120 && (
      <p>⚠️ Η πρόσληψη πρωτεΐνης είναι χαμηλή. Ενίσχυσε την για μυϊκή διατήρηση.</p>
    )}
    {fat * weight > 100 && (
      <p>⚠️ Η πρόσληψη λίπους φαίνεται υψηλή. Έλεγξε τα ποιοτικά χαρακτηριστικά των λιπαρών.</p>
    )}
    {carbs && carbs < 150 && (
      <p>⚠️ Οι υδατάνθρακες είναι πολύ χαμηλοί. Μπορεί να επηρεάσει την απόδοση ή διάθεση.</p>
    )}
  </div>

  <div className="space-y-3 text-sm">
    {carbs && protein && fat && (
      <>
        <p>🍽️ <strong>Πρωινό:</strong> Βρώμη με γάλα/φυτικό ρόφημα, 1 μπανάνα, 20g φυστικοβούτυρο — πηγή υδατανθράκων, λιπαρών & πρωτεΐνης.</p>
        <p>🥗 <strong>Μεσημεριανό:</strong> Κοτόπουλο/τοφού με ρύζι & λαχανικά — ισορροπία macros με έμφαση σε πρωτεΐνη & ενέργεια.</p>
        <p>🥚 <strong>Σνακ:</strong> Γιαούρτι ή αυγά με φρούτο — χαμηλό σε υδατάνθρακες, υψηλό σε πρωτεΐνη.</p>
        <p>🍝 <strong>Βραδινό:</strong> Ψάρι ή φακές με πατάτες/κους κους — μέτρια υδατάνθρακες, υψηλή βιοδιαθεσιμότητα.</p>
        <p className="italic text-xs text-gray-500">💡 Οι επιλογές είναι ενδεικτικές και προσαρμόζονται δυναμικά με βάση τα macros.</p>
      </>
    )}
  </div>
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
          onBlur={(e) => {
            const intake = parseInt(e.target.value);
            const diff = intake - tdee;
            if (!isNaN(diff)) alert(`Διαφορά από στόχο: ${diff > 0 ? '+' : ''}${diff} kcal`);
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Macros (π.χ. 140/50/200):</label>
        <input type="text" placeholder="πρωτεΐνη/λίπος/υδατάνθρακες σε g" className={inputStyle} />
      </div>
      <div className="mt-4 p-4 rounded bg-white dark:bg-gray-800 border border-yellow-300 text-sm text-yellow-800 dark:text-yellow-200">
        {(() => {
          const targetProtein = protein * weight;
          const targetFat = fat * weight;
          const targetCarbs = parseFloat(carbs);
          const actuals = { protein: 0, fat: 0, carbs: 0 };
          const inputs = document.querySelector("input[placeholder='πρωτεΐνη/λίπος/υδατάνθρακες σε g']")?.value.split("/");
          if (inputs?.length === 3) {
            actuals.protein = parseFloat(inputs[0]) || 0;
            actuals.fat = parseFloat(inputs[1]) || 0;
            actuals.carbs = parseFloat(inputs[2]) || 0;
          }
          const deltas = {
            protein: ((actuals.protein - targetProtein) / targetProtein) * 100,
            fat: ((actuals.fat - targetFat) / targetFat) * 100,
            carbs: ((actuals.carbs - targetCarbs) / targetCarbs) * 100,
          };
          return (
            <>
              {Math.abs(deltas.protein) > 10 && (
                <p>⚠️ Πρωτεΐνη: {deltas.protein.toFixed(1)}% απόκλιση από τον στόχο.</p>
              )}
              {Math.abs(deltas.fat) > 10 && (
                <p>⚠️ Λίπος: {deltas.fat.toFixed(1)}% απόκλιση από τον στόχο.</p>
              )}
              {Math.abs(deltas.carbs) > 10 && (
                <p>⚠️ Υδατάνθρακες: {deltas.carbs.toFixed(1)}% απόκλιση από τον στόχο.</p>
              )}
            </>
          );
        })()}
      </div>
    </div>
  )}
</CollapsibleSection>

              <CollapsibleSection title="🥗 Προγραμματισμός Γευμάτων ανά Ημέρα">
  <DndContext
    collisionDetection={closestCenter}
    onDragEnd={({ active, over }) => {
      if (active.id !== over?.id) {
        setDaysOrder((items) => {
          const oldIndex = items.indexOf(active.id);
          const newIndex = items.indexOf(over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }}
  >
    <SortableContext items={daysOrder} strategy={verticalListSortingStrategy}>
      {daysOrder.map((day) => (
        <SortableItem key={day} id={day}>
          <div className="border border-yellow-300 rounded p-3 mt-2">
            <p className="font-bold text-yellow-500">📅 {day}</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {["breakfast", "lunch", "snack", "dinner"].map((mealType) => {
                const emoji =
                  mealType === "breakfast"
                    ? "🍽️"
                    : mealType === "lunch"
                    ? "🥗"
                    : mealType === "snack"
                    ? "🥚"
                    : "🍝";
                const mealKey = `${day}-${mealType}`;
                const mealName = customMeals[mealKey] || getRandomMeal(mealType);
                const food = allFoods.find((f) => f.name === mealName);

                return (
                  <li key={mealKey} className="break-words leading-tight">
                    {emoji} {mealType.charAt(0).toUpperCase() + mealType.slice(1)}:
                    <input
                      title="Εισαγωγή ή τροποποίηση γεύματος"
                      className={`w-full p-2 rounded text-sm border mt-1 ${theme === "dark"
                        ? "bg-gray-800 text-white border-gray-700"
                        : "bg-white text-black border-gray-300"
                        }`}
                      value={mealName}
                      onChange={(e) =>
                        setCustomMeals({ ...customMeals, [mealKey]: e.target.value })
                      }
                    />
                    <button
                      className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded mt-2"
                      title="Αυτόματη αντικατάσταση από βάση"
                      onClick={() => handleReplacement(day, mealType)}
                    >
                      🔁 Αντικατάσταση
                    </button>
                    {food && (
                      <div className="mt-2 p-2 rounded bg-yellow-100 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-100">
                        <p>
                          📊 Μακροθρεπτικά: {food.protein}g P / {food.fat}g F / {food.carbs}g C
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Σύγκριση στόχων vs actual per ημέρα */}
           <CollapsibleSection title="📊 Σύνολο Μακροθρεπτικών από Πλάνο">
  {(() => {
    const target = {
      protein: protein * weight,
      fat: fat * weight,
      carbs: parseFloat(carbs)
    };
    const actual = getTotalMacrosFromPlan();
    const delta = {
      protein: actual.protein - target.protein,
      fat: actual.fat - target.fat,
      carbs: actual.carbs - target.carbs
    };

    return (
      <>
        <div className="text-sm space-y-2">
          <p>🎯 Στόχος: {target.protein}g πρωτεΐνη, {target.fat}g λίπος, {target.carbs}g υδατάνθρακες</p>
          <p>📦 Πλάνο: {actual.protein}g P / {actual.fat}g F / {actual.carbs}g C</p>
          <p className="text-yellow-700 dark:text-yellow-300">
            ✏️ Διαφορά: {delta.protein.toFixed(1)} P / {delta.fat.toFixed(1)} F / {delta.carbs.toFixed(1)} C
          </p>
        </div>
        <p className="text-yellow-700 dark:text-yellow-300">
          🔥 Θερμίδες από το πλάνο: {getTotalKcalFromPlan(customMeals, foodDB, userFoods)} kcal
        </p>
      </>
    );
  })()}
</CollapsibleSection>
          </div>
        </SortableItem>
      ))}
    </SortableContext>
  </DndContext>
</CollapsibleSection>

<Tabs defaultTab="Σύνολο">
  <Tab label="📊 Σύνολο">
    <CollapsibleSection title="📊 Σύνολο Μακροθρεπτικών από Πλάνο">
      {(() => {
        const target = {
          protein: protein * weight,
          fat: fat * weight,
          carbs: parseFloat(carbs)
        };
        const actual = getTotalMacrosFromPlan();
        const delta = {
          protein: actual.protein - target.protein,
          fat: actual.fat - target.fat,
          carbs: actual.carbs - target.carbs
        };

        return (
          <>
            <div className="text-sm space-y-2">
              <p>🎯 Στόχος: {target.protein}g πρωτεΐνη, {target.fat}g λίπος, {target.carbs}g υδατάνθρακες</p>
              <p>📦 Πλάνο: {actual.protein}g P / {actual.fat}g F / {actual.carbs}g C</p>
              <p className="text-yellow-700 dark:text-yellow-300">
                ✏️ Διαφορά: {delta.protein.toFixed(1)} P / {delta.fat.toFixed(1)} F / {delta.carbs.toFixed(1)} C
              </p>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300">
              🔥 Θερμίδες από το πλάνο: {getTotalKcalFromPlan(customMeals, foodDB, userFoods)} kcal
            </p>
          </>
        );
      })()}
    </CollapsibleSection>

    <div className="flex flex-wrap gap-4 mt-4 sticky top-0 z-10 bg-opacity-80 backdrop-blur border-b py-2 px-2">
      <button onClick={saveMealsToSupabase} className="bg-green-500 px-3 py-1 rounded text-white text-sm" title="Αποθήκευση των γευμάτων στο cloud">
        ☁️ Αποθήκευση στο Cloud
      </button>
      <button onClick={loadMealsFromSupabase} className="bg-blue-500 px-3 py-1 rounded text-white text-sm" title="Φόρτωση γευμάτων από το cloud">
        🔄 Φόρτωση από Cloud
      </button>
      <button onClick={savePlanToSupabase} className="bg-green-600 text-white px-4 py-2 rounded ml-auto" title="Αποθήκευση πλάνου στον server">
        💾 Αποθήκευση
      </button>
      <button onClick={loadPlanFromSupabase} className="bg-blue-600 text-white px-4 py-2 rounded" title="Φόρτωση πλάνου από τον server">
        ☁️ Φόρτωση
      </button>
    </div>

    <CollapsibleSection title="👁️ Προεπισκόπηση Εβδομαδιαίου Πλάνου">
      <div className="space-y-4 text-sm">
        {daysOrder.map((day) => (
          <div key={day} className="p-4 border border-yellow-300 rounded">
            <h3 className="font-bold text-yellow-600 dark:text-yellow-300 mb-2">📅 {day}</h3>
            <ul className="space-y-1">
              {['breakfast', 'lunch', 'snack', 'dinner'].map((mealType) => {
                const mealName = customMeals[`${day}-${mealType}`] || "-";
                return (
                  <li key={`${day}-${mealType}`} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
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
        const total = daysOrder.reduce((acc, day) => {
          ['breakfast', 'lunch', 'snack', 'dinner'].forEach(meal => {
            const mealName = customMeals[`${day}-${meal}`];
            const food = allFoods.find(f => f.name === mealName);
            if (food) {
              acc.protein += food.protein;
              acc.fat += food.fat;
              acc.carbs += food.carbs;
            }
          });
          return acc;
        }, { protein: 0, fat: 0, carbs: 0 });

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
    <button onClick={exportToPDF} className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
      📄 PDF
    </button>
    <button onClick={exportToCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
      📑 CSV
    </button>
    <button onClick={sharePlan} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
      📤 Κοινοποίηση
    </button>
  </div>
</CollapsibleSection>

{intakeHistory.length > 0 && (
  <CollapsibleSection title="📈 Ιστορικό Θερμίδων">
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={intakeHistory} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
        <YAxis stroke="#888" tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `${value} kcal`} />
        <Line type="monotone" dataKey="kcal" stroke="#facc15" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </CollapsibleSection>
)}
 
     <TabsCompo activeTab="🥗 Γεύματα" tabs={["📊 AI Προτάσεις", "🥗 Γεύματα", "📈 Σύγκριση"]} />

  <Tab label="🥫 Τρόφιμα">
    <CollapsibleSection title="🍽️ Προσθήκη Τροφίμων">
      <input type="text" placeholder="Αναζήτησε τρόφιμο..." className={`p-2 w-full rounded ${inputStyle}`} onChange={(e) => setFoodSearch(e.target.value)} />
      <div className="grid grid-cols-5 gap-2 text-xs mb-4 mt-2">
        <input placeholder="Όνομα" className={inputStyle} id="nf" />
        <input placeholder="P" className={inputStyle} id="np" type="number" />
        <input placeholder="F" className={inputStyle} id="nfat" type="number" />
        <input placeholder="C" className={inputStyle} id="nc" type="number" />
        <button className="bg-green-500 text-white px-2 py-1 rounded" onClick={addCustomFood}>
          ➕ Προσθήκη
        </button>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="🗓️ Αντιστοίχιση Γευμάτων">
      <div className="flex gap-2 mb-4">
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className={`p-2 rounded ${inputStyle}`}>
          {daysOrder.map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>

        <select value={selectedMealType} onChange={(e) => setSelectedMealType(e.target.value)} className={`p-2 rounded ${inputStyle}`}>
          <option value="breakfast">Πρωινό</option>
          <option value="lunch">Μεσημεριανό</option>
          <option value="snack">Σνακ</option>
          <option value="dinner">Βραδινό</option>
        </select>
      </div>
    </CollapsibleSection>
  </Tab>

   <Tabs defaultTab="🥫 Τρόφιμα">
  <Tab label="🥫 Τρόφιμα">
    <CollapsibleSection title="📦 Λίστα Τροφίμων (user + default)">
      <table className="w-full text-sm border border-gray-300 dark:border-gray-600">
        <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0 z-10">
          <tr>
            <th className="p-2">Τρόφιμο</th>
            <th className="p-2">Πρωτεΐνη</th>
            <th className="p-2">Λίπος</th>
            <th className="p-2">Υδατ.</th>
            <th className="p-2">Ενέργεια</th>
            <th className="p-2">Ενέργειες</th>
          </tr>
        </thead>
        <tbody>
          {userFoods.map((item, i) => (
            <tr key={`u-${i}`} className="text-center border-t dark:border-gray-700 bg-yellow-50 dark:bg-gray-800">
              <td className="p-2">{item.name}</td>
              <td className="p-2">{item.protein}g</td>
              <td className="p-2">{item.fat}g</td>
              <td className="p-2">{item.carbs}g</td>
              <td className="p-2">{4 * item.protein + 9 * item.fat + 4 * item.carbs} kcal</td>
              <td className="p-2">
                <div className="flex gap-1 justify-center">
                  <button
                    className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500"
                    title="Προσθήκη στο Πλάνο"
                    onClick={() => {
                      const mealName = item.name;
                      const newMeals = { ...customMeals };
                      const mealKey = `${selectedDay}-${selectedMealType}`;
                      newMeals[mealKey] = mealName;
                      setCustomMeals(newMeals);
                    }}
                  >
                    ➕ Στο Πλάνο
                  </button>
                  <button
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    title="Επεξεργασία Τροφίμου"
                    onClick={() => {
                      const newName = prompt("✏️ Νέο όνομα:", item.name);
                      const newProtein = prompt("Πρωτεΐνη (g):", item.protein);
                      const newFat = prompt("Λίπος (g):", item.fat);
                      const newCarbs = prompt("Υδατάνθρακες (g):", item.carbs);
                      if (!newName || isNaN(newProtein) || isNaN(newFat) || isNaN(newCarbs)) return;
                      const updatedFoods = [...userFoods];
                      updatedFoods[i] = {
                        name: newName,
                        protein: parseFloat(newProtein),
                        fat: parseFloat(newFat),
                        carbs: parseFloat(newCarbs)
                      };
                      setUserFoods(updatedFoods);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    title="Διαγραφή Τροφίμου"
                    onClick={() => {
                      const updatedFoods = [...userFoods];
                      updatedFoods.splice(i, 1);
                      setUserFoods(updatedFoods);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {filteredFoods.map((item, i) => (
            <tr key={i} className="text-center border-t dark:border-gray-700">
              <td className="p-2">{item.name}</td>
              <td className="p-2">{item.protein}g</td>
              <td className="p-2">{item.fat}g</td>
              <td className="p-2">{item.carbs}g</td>
              <td className="p-2">{4 * item.protein + 9 * item.fat + 4 * item.carbs} kcal</td>
              <td className="p-2">
                <button
                  className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500"
                  title="Προσθήκη στο Πλάνο"
                  onClick={() => {
                    const mealName = item.name;
                    const newMeals = { ...customMeals };
                    const mealKey = `${selectedDay}-${selectedMealType}`;
                    newMeals[mealKey] = mealName;
                    setCustomMeals(newMeals);
                  }}
                >
                  ➕ Στο Πλάνο
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsibleSection>
  </Tab>
</Tabs>
<CollapsibleSection title="📊 Σύγκριση Μακροθρεπτικών">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <MacroComparisonChart
      data={macroComparisonData}
      colors={COLORS}
      tooltipFormatter={(value) => `${value}g`}
    />
    <MacroBarChart
      data={macroBarData}
      colors={COLORS}
      tooltipFormatter={(value) => `${value}g`}
    />
  </div>
      </CollapsibleSection>
      </motion.div>
</SignedIn>
);
}
