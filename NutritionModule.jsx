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
      "Βρώμη με γάλα και μπανάνα",
      "Αβγά με τοστ ολικής",
      "Smoothie με πρωτεΐνη και μούρα",
      "Γιαούρτι με μέλι και καρύδια"
    ],
    lunch: [
      "Κοτόπουλο με ρύζι και μπρόκολο",
      "Τοφού stir-fry με λαχανικά",
      "Μοσχάρι με πατάτες φούρνου",
      "Φακές με καστανό ρύζι"
    ],
    snack: [
      "Γιαούρτι με φρούτα",
      "Protein bar",
      "Αμύγδαλα και μήλο",
      "Βραστό αυγό με φρυγανιά"
    ],
    dinner: [
      "Ψάρι με κους κους",
      "Ομελέτα με λαχανικά",
      "Κινόα με φασόλια",
      "Ρεβύθια με καρότο και πατάτα"
    ]
  };

  const getRandomMeal = (type) => {
    const meals = mealOptions[type];
    const filteredMeals = meals.filter((meal) => {
      if (preference === "vegetarian") return !meal.includes("Κοτόπουλο") && !meal.includes("Μοσχάρι") && !meal.includes("Ψάρι") && !meal.includes("αβγά");
      if (preference === "lowcarb") return !meal.includes("ρύζι") && !meal.includes("πατάτες") && !meal.includes("κους κους") && !meal.includes("τοστ") && !meal.includes("βρώμη");
      return true;
    });
    const pool = filteredMeals.length > 0 ? filteredMeals : meals;
    return pool[Math.floor(Math.random() * pool.length)];
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
          <h2 className="text-2xl font-semibold mb-4">AI Προτάσεις</h2>
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
      <p className="text-xs italic text-gray-500">💡 Σύντομα θα υπολογίζεται και η ποσοστιαία απόκλιση ανά macro.</p>
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
            </li>
            <li className="break-words leading-tight">🥗 Μεσημεριανό:
              <input
  className={`w-full p-2 rounded text-sm border ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
value={customMeals[`${day}-lunch`] || getRandomMeal("lunch")}
onChange={(e) => setCustomMeals({ ...customMeals, [`${day}-lunch`]: e.target.value })}
              />
            </li>
            <li className="break-words leading-tight">🥚 Σνακ:
              <input
  className={`w-full p-2 rounded text-sm border ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
value={customMeals[`${day}-snack`] || getRandomMeal("snack")}
onChange={(e) => setCustomMeals({ ...customMeals, [`${day}-snack`]: e.target.value })}
              />
            </li>
            <li className="break-words leading-tight">🍝 Βραδινό:
              <input
  className={`w-full p-2 rounded text-sm border ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
value={customMeals[`${day}-dinner`] || getRandomMeal("dinner")}
onChange={(e) => setCustomMeals({ ...customMeals, [`${day}-dinner`]: e.target.value })}
              />
            </li>
          </ul>
        </div>
      </SortableItem>
    ))}
  </SortableContext>
</DndContext>

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
</motion.div>
     </SignedIn>
  );
}
