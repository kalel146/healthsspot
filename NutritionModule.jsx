import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@supabase/supabase-js";
import { useUser, SignedIn } from "@clerk/clerk-react";

const supabase = createClient("https://lfhnlalktlcjyhelblci.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmaG5sYWxrdGxjanloZWxibGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDI4MjEsImV4cCI6MjA2MzQxODgyMX0.qxOxqg2ObJBUJF5vKcQclIHgJa_1wYGrmWtxSU4Amvg");

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function NutritionModule() {
  const [foodSearch, setFoodSearch] = useState("");
  const foodDB = [
    { name: "Αβγό", protein: 6, fat: 5, carbs: 0.5 },
    { name: "Κοτόπουλο (100g)", protein: 31, fat: 3.6, carbs: 0 },
    { name: "Ρύζι (100g μαγειρεμένο)", protein: 2.7, fat: 0.3, carbs: 28 },
    { name: "Μπανάνα", protein: 1.3, fat: 0.3, carbs: 27 },
    { name: "Γιαούρτι 2% (100g)", protein: 10, fat: 2, carbs: 4 },
    { name: "Φακές (μαγειρεμένες)", protein: 9, fat: 0.4, carbs: 20 },
    { name: "Τοφού", protein: 8, fat: 4.8, carbs: 1.9 },
    { name: "Σολομός (100g)", protein: 20, fat: 13, carbs: 0 },
    { name: "Ψωμί ολικής (φέτα)", protein: 4, fat: 1, carbs: 12 },
    { name: "Αμύγδαλα (10τμχ)", protein: 2.5, fat: 5.5, carbs: 2 }
  ];
  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemPrefersDark && theme !== 'dark') toggleTheme();
    if (!systemPrefersDark && theme === 'dark') toggleTheme();
  }, []);
    const [intakeHistory, setIntakeHistory] = useState([]);
  const { user } = useUser();
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState("male");
  const [activity, setActivity] = useState(1.55);
  const [bmr, setBmr] = useState(null);
  const [tdee, setTdee] = useState(null);
const [protein, setProtein] = useState(() =>
  parseFloat(localStorage.getItem("protein")) || 2
);
const [fat, setFat] = useState(() =>
  parseFloat(localStorage.getItem("fat")) || 1
);
const [carbs, setCarbs] = useState(() => {
  const saved = localStorage.getItem("carbs");
  return saved ? parseFloat(saved) : null;
});
  const { theme, toggleTheme } = useTheme();


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

const [preference, setPreference] = useState(() =>
  localStorage.getItem("preference") || "default"
);
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
 const [selectedDay, setSelectedDay] = useState(daysOrder[0]);
const [selectedMealType, setSelectedMealType] = useState("snack");

React.useEffect(() => {
  localStorage.setItem("protein", protein);
}, [protein]);

React.useEffect(() => {
  localStorage.setItem("fat", fat);
}, [fat]);

React.useEffect(() => {
  localStorage.setItem("preference", preference);
}, [preference]);

React.useEffect(() => {
  localStorage.setItem("daysOrder", JSON.stringify(daysOrder));
}, [daysOrder]);

React.useEffect(() => {
  if (carbs !== null) {
    localStorage.setItem("carbs", carbs);
  }
}, [carbs]);
  
React.useEffect(() => {
  localStorage.setItem("customMeals", JSON.stringify(customMeals));
}, [customMeals]);

  useEffect(() => {
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (systemPrefersDark && theme !== 'dark') toggleTheme();
  if (!systemPrefersDark && theme === 'dark') toggleTheme();
}, []);

  
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


  const [userFoods, setUserFoods] = useState(() => {
  const saved = localStorage.getItem("userFoods");
  return saved ? JSON.parse(saved) : [];
});

  useEffect(() => {
  localStorage.setItem("userFoods", JSON.stringify(userFoods));
}, [userFoods]);

const generateMealPlanFromTargets = () => {
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

      <div className="max-w-xl mx-auto space-y-10">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">🎛️ Προτιμήσεις:</label>
          <select value={preference} onChange={(e) => setPreference(e.target.value)} className={`p-2 rounded w-full border text-sm ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`} >
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
          'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'
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
        inputs.forEach(input => input.value = "");

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
          <h1 className="text-4xl font-extrabold tracking-tight text-yellow-400 drop-shadow">
            Nutrition Lab
          </h1>
          <button
            onClick={toggleTheme}
            className="text-2xl hover:text-yellow-400 transition"
            title="Switch theme"
          >
            {theme === "dark" ? "☀" : "🌙"}
          </button>
        </div>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">Υπολογισμός BMR / TDEE</h2>
          <div className="space-y-4">
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Βάρος (kg)" className={`p-2 rounded ${inputStyle}`} />
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ύψος (cm)" className={`p-2 rounded ${inputStyle}`} />
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ηλικία" className={`p-2 rounded ${inputStyle}`} />
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={`p-2 rounded ${inputStyle}`}>
              <option value="male">Άνδρας</option>
              <option value="female">Γυναίκα</option>
            </select>
            <select value={activity} onChange={(e) => setActivity(Number(e.target.value))} className={`p-2 rounded ${inputStyle}`}>
              <option value={1.2}>Καθιστική ζωή</option>
              <option value={1.375}>Ελαφριά δραστηριότητα</option>
              <option value={1.55}>Μέτρια δραστηριότητα</option>
              <option value={1.725}>Έντονη δραστηριότητα</option>
              <option value={1.9}>Πολύ έντονη δραστηριότητα</option>
            </select>
            <button onClick={calculateNutrition} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">
              Υπολόγισε
            </button>
            {bmr && tdee && (
              <p className="mt-2">
                <strong>BMR:</strong> {bmr} kcal | <strong>TDEE:</strong> {tdee} kcal
              </p>
            )}
          </div>
        </section>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">Διατροφικοί Στόχοι (Macros)</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
  <button
    onClick={generateMealPlanFromTargets}
    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
  >
    🧠 Αυτόματο Εβδομαδιαίο Πλάνο
  </button>
</div>

            <div>
              <label className="block text-sm font-medium mb-1">Πρωτεΐνη (g/kg): {protein}</label>
              <input type="range" min="0.5" max="3" step="0.1" value={protein} onChange={(e) => setProtein(parseFloat(e.target.value))} className="w-full" />
              <p className="text-xs text-gray-600 italic mt-1">{getProteinLabel(protein)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Λίπος (g/kg): {fat}</label>
              <input type="range" min="0.3" max="2" step="0.1" value={fat} onChange={(e) => setFat(parseFloat(e.target.value))} className="w-full" />
              <p className="text-xs text-gray-600 italic mt-1">{getFatLabel(fat)}</p>
            </div>
            {carbs && (
              <>
                <p className="mt-2">
                  Πρωτεΐνη: {protein * weight}g | Λίπος: {fat * weight}g | Υδατάνθρακες: {carbs}g
                </p>
                <div className="w-full h-64 mt-4">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        </section>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">AI Προτάσεις <span className='bg-yellow-300 text-black text-xs font-semibold px-2 py-0.5 ml-2 rounded'>← εδώ θα μπει το alert block</span></h2>
          <div className="space-y-4 text-sm">
            {tdee && (
              <>
                <p>
                  ⚡ <strong>Συνολικές θερμίδες:</strong> {tdee} kcal. 
                  Προσαρμόστε ανάλογα με τον στόχο σας (μείωση, διατήρηση, αύξηση βάρους).
                </p>
                <p>
                  🍗 <strong>Πρωτεΐνη:</strong> {(protein * weight).toFixed(0)}g —
                  {protein >= 2 ? " ιδανική για ανάπτυξη μυϊκής μάζας." : protein >= 1.2 ? " επαρκής για υγιή λειτουργία και διατήρηση." : " χαμηλή, ίσως χρειάζεται ενίσχυση."}
                </p>
                <p>
                  🧈 <strong>Λίπος:</strong> {(fat * weight).toFixed(0)}g —
                  {fat >= 1.2 ? " πιθανή υπέρβαση λίπους." : fat >= 0.6 ? " εντός φυσιολογικών ορίων." : " πολύ χαμηλό, πρόσεχε για ορμονική υγεία."}
                </p>
                <p>
                  🍞 <strong>Υδατάνθρακες:</strong> {carbs}g — βασική πηγή ενέργειας. Προσάρμοσε ανάλογα με ένταση/όγκο προπόνησης.
                </p>
              </>
            )}
          </div>
        </section>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">Προτάσεις Ανά Στόχο</h2>
          <div className="space-y-3 text-sm">
            {tdee && (
              <>
                <p>🎯 <strong>Cut (Απώλεια Λίπους):</strong> Προτεινόμενο έλλειμμα ~15-25% → {(tdee * 0.75).toFixed(0)} kcal. Μείωσε υδατάνθρακες κυρίως, κράτησε πρωτεΐνη ψηλά για μυϊκή διατήρηση.</p>
                <p>⚖️ <strong>Maintain (Σταθερό Βάρος):</strong> Κράτησε πρόσληψη στο TDEE → {tdee} kcal. Ισορροπία macros, ευελιξία για lifestyle/απόδοση.</p>
                <p>💪 <strong>Bulk (Μυϊκή Ανάπτυξη):</strong> Προτεινόμενο surplus ~10-15% → {(tdee * 1.15).toFixed(0)} kcal. Αύξησε υδατάνθρακες κυρίως, μέτρια αύξηση λίπους.</p>
              </>
            )}
          </div>
        </section>

        <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
          <h2 className="text-2xl font-semibold mb-4">AI Meal Plan Προτάσεις</h2>
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
          <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
  <h2 className="text-2xl font-semibold mb-4">📆 Καταγραφή Πρόσληψης & Σύγκριση με Στόχους</h2>
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
</section>

        </section>

        
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
        <div className="border border-yellow-300 rounded p-3">
          <p className="font-bold text-yellow-500">📅 {day}</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li className="break-words leading-tight">🍽️ Πρωινό:
              <input
                className={`w-full p-2 rounded text-sm border ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
value={customMeals[`${day}-breakfast`] || getRandomMeal("breakfast")}
onChange={(e) => setCustomMeals({ ...customMeals, [`${day}-breakfast`]: e.target.value })}
              />
              <button
  className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded mt-2"
  onClick={() => handleReplacement(day, "breakfast")}
>
  🔁 Αντικατάσταση
</button>
            </li>
            <li className="break-words leading-tight">🥗 Μεσημεριανό:
              <input
               className={`w-full p-2 rounded text-sm border ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
value={customMeals[`${day}-lunch`] || getRandomMeal("lunch")}
onChange={(e) => setCustomMeals({ ...customMeals, [`${day}-lunch`]: e.target.value })}
              />
               <button
  className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded mt-2"
  onClick={() => handleReplacement(day, "lunch")}
>
  🔁 Αντικατάσταση
</button>
            </li>
            <li className="break-words leading-tight">🥚 Σνακ:
              <input
                className={`w-full p-2 rounded text-sm border ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
value={customMeals[`${day}-snack`] || getRandomMeal("snack")}
onChange={(e) => setCustomMeals({ ...customMeals, [`${day}-snack`]: e.target.value })}
              />
              <button
  className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded mt-2"
  onClick={() => handleReplacement(day, "snack")}
>
  🔁 Αντικατάσταση
</button>
            </li>
            <li className="break-words leading-tight">🍝 Βραδινό:
              <input
               className={`w-full p-2 rounded text-sm border ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
value={customMeals[`${day}-dinner`] || getRandomMeal("dinner")}
onChange={(e) => setCustomMeals({ ...customMeals, [`${day}-dinner`]: e.target.value })}
              />
               <button
  className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded mt-2"
  onClick={() => handleReplacement(day, "dinner")}
>
  🔁 Αντικατάσταση
</button>

  
            </li>
          </ul>
        </div>
      </SortableItem>
    ))}
  </SortableContext>
</DndContext>

<section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
  <h2 className="text-2xl font-semibold mb-4">📊 Σύνολο Μακροθρεπτικών από Πλάνο</h2>
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
  <div className="space-y-2 text-sm">
    <p>🎯 Στόχος: {target.protein}g πρωτεΐνη, {target.fat}g λίπος, {target.carbs}g υδατάνθρακες</p>
    <p>📦 Πλάνο: {actual.protein}g P / {actual.fat}g F / {actual.carbs}g C</p>
    <p className="text-yellow-700 dark:text-yellow-300">✏️ Διαφορά: {delta.protein.toFixed(1)} P / {delta.fat.toFixed(1)} F / {delta.carbs.toFixed(1)} C</p>
    <p className="text-yellow-700 dark:text-yellow-300">
      🔥 Θερμίδες από το πλάνο: {getTotalKcalFromPlan(customMeals, foodDB, userFoods)} kcal
    </p>
  </div>
    );
  })()}
</section>

        
<section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
  <h2 className="text-2xl font-semibold mb-4">📤 Export σε PDF</h2>
  <button
    onClick={() => {
      import("html2canvas").then(({ default: html2canvas }) => {
        import("jspdf").then(({ default: jsPDF }) => {
          const target = document.body;
          html2canvas(target).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, width, height);
            const today = new Date().toLocaleDateString("el-GR").replaceAll("/", "-");
            pdf.save(`nutrition-plan-${today}.pdf`);
          });
        });
      });
    }}
    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
  >
    📥 Κατέβασε ως PDF
  </button>
</section>

<section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
  <h2 className="text-2xl font-semibold mb-4">📤 Export σε CSV</h2>
  <button
    onClick={() => {
      const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
      const rows = daysOrder.map(day => {
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
    }}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
  >
    📤 Κατέβασε ως CSV
  </button>
</section>

</div>
{intakeHistory.length > 0 && (
  <section className="max-w-xl mx-auto bg-yellow-100 dark:bg-gray-900 p-4 rounded-xl shadow space-y-4">
    <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">📈 Ιστορικό Θερμίδων</h2>
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={intakeHistory} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <XAxis dataKey="date" stroke="#888" tick={{ fontSize: 12 }} />
        <YAxis stroke="#888" tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `${value} kcal`} />
        <Line type="monotone" dataKey="kcal" stroke="#facc15" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </section>
)}
      <section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
  <h2 className="text-2xl font-semibold mb-4">🔗 Κοινοποίηση Πλάνου</h2>
  <p className="text-sm text-gray-600 dark:text-gray-300">
    Μοιράσου το πλάνο σου με άλλους ή στείλε το στον πελάτη σου.
  </p>
  <button
    onClick={() => {
      const url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: "Nutrition Plan", url });
      } else {
        window.open(
          `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=150x150`,
          "_blank"
        );
      }
    }}
    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
  >
    📤 Κοινοποίησε Πλάνο
  </button>
</section>
      
<section className={`${sectionStyle} ${theme === "dark" ? "bg-gray-900" : "bg-yellow-100"}`}>
  <h2 className="text-2xl font-semibold mb-4">🍽️ Τροφές & Μακροθρεπτικά</h2>
  <div className="space-y-4">
    <input
      type="text"
      placeholder="Αναζήτησε τρόφιμο..."
      className={`p-2 w-full rounded ${inputStyle}`}
      onChange={(e) => setFoodSearch(e.target.value)}
    />
    <div className="grid grid-cols-5 gap-2 text-xs mb-4">
  <input placeholder="Όνομα" className={inputStyle} id="nf" />
  <input placeholder="P" className={inputStyle} id="np" type="number" />
  <input placeholder="F" className={inputStyle} id="nfat" type="number" />
  <input placeholder="C" className={inputStyle} id="nc" type="number" />
  <button
    className="bg-green-500 text-white px-2 py-1 rounded"
    onClick={() => {
      const name = document.getElementById("nf").value;
      const protein = parseFloat(document.getElementById("np").value);
      const fat = parseFloat(document.getElementById("nfat").value);
      const carbs = parseFloat(document.getElementById("nc").value);
      if (!name || isNaN(protein) || isNaN(fat) || isNaN(carbs)) return;
      setUserFoods([...userFoods, { name, protein, fat, carbs }]);
      document.getElementById("nf").value = "";
      document.getElementById("np").value = "";
      document.getElementById("nfat").value = "";
      document.getElementById("nc").value = "";
    }}
  >
    ➕ Προσθήκη
  </button>
</div>

<div className="flex gap-2 mb-4">
  <select
    value={selectedDay}
    onChange={(e) => setSelectedDay(e.target.value)}
    className={`p-2 rounded ${inputStyle}`}
  >
    {daysOrder.map((day) => (
      <option key={day} value={day}>{day}</option>
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

    
    <table className="w-full text-sm border border-gray-300 dark:border-gray-600">
      <thead className="bg-gray-200 dark:bg-gray-700">
        <tr>
          <th className="p-2">Τρόφιμο</th>
          <th className="p-2">Πρωτεΐνη</th>
          <th className="p-2">Λίπος</th>
          <th className="p-2">Υδατ.</th>
<th className="p-2">Ενέργεια</th>
        </tr>
      </thead>
      <tbody>

        {userFoods.map((item, i) => (
  <tr key={`u-${i}`} className="text-center border-t dark:border-gray-700 bg-yellow-50 dark:bg-gray-800">
    <td className="p-2">{item.name}</td>
    <td className="p-2">{item.protein}g</td>
    <td className="p-2">{item.fat}g</td>
    <td className="p-2">{item.carbs}g</td>
    <td className="p-2">
      <button
  className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500"
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

        {foodDB
          .filter((item) => item.name.toLowerCase().includes(foodSearch.toLowerCase()))
          .map((item, i) => (
            <tr key={i} className="text-center border-t dark:border-gray-700">
              <td className="p-2">{item.name}</td>
              <td className="p-2">{item.protein}g</td>
              <td className="p-2">{item.fat}g</td>
              <td className="p-2">{item.carbs}g</td>
<td className="p-2">
  <div className="flex gap-1 justify-center">
  <button
    className="text-xs bg-yellow-400 text-black px-2 py-1 rounded hover:bg-yellow-500"
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
    onClick={() => {
      if (window.confirm("❌ Να διαγραφεί αυτή η τροφή;")) {
        const updated = userFoods.filter((_, index) => index !== i);
        setUserFoods(updated);
      }
    }}
  >
    🗑️
  </button>
</div>

</td>
            </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

</motion.div>
     </SignedIn>
  );
}
