import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useUser } from "@clerk/clerk-react";
import { useTheme } from "./ThemeContext";
import defaultMeals from "./defaultMeals.json";
import TabsCompo from "./TabsCompo";
import PlanDayCard from "./PlanDayCard";
import {
  safeNum,
  round1,
  calculateNutritionSummary,
  createFoodMap,
  getFoodByName,
  getTotalMacrosFromMeals,
  getTotalKcalFromMeals,
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

export default function NutritionModule() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();

  const panelClass =
    theme === "dark"
      ? "bg-zinc-900/95 border border-zinc-800 text-zinc-100"
      : "bg-white/95 border border-zinc-200 text-zinc-900";

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

  useNutritionPersistence({ protein, fat, carbs, preference, daysOrder, customMeals, userFoods });

  const [userThemeOverride, setUserThemeOverride] = useState(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (isDark) => {
      if (userThemeOverride != null) return;
      const shouldBeDark = theme === "dark";
      if (isDark && !shouldBeDark) toggleTheme();
      if (!isDark && shouldBeDark) toggleTheme();
    };
    apply(mq.matches);
    const handler = (e) => apply(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme, toggleTheme, userThemeOverride]);

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
  const mealOptions = {};
  const mealOptionsFlat = useMemo(() => Object.values(mealOptions).flat(), [mealOptions]);
  const allFoods = useMemo(() => [...foodDB, ...defaultMeals, ...userFoods], [foodDB, userFoods]);
  const allFoodsFull = useMemo(() => [...allFoods, ...mealOptionsFlat], [allFoods, mealOptionsFlat]);
  const filteredFoods = useMemo(
    () => allFoods.filter((item) => item.name.toLowerCase().includes(foodSearch.toLowerCase())),
    [foodSearch, allFoods]
  );
  const filteredFoodsSafe = filteredFoods.filter(isValidFood);
  const userFoodsSafe = userFoods.filter(isValidFood);

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

  const handleReplacement = useCallback((day, mealType) => {
    const pool = allFoods.filter((food) => {
      if (preference === "vegetarian") return !/(κοτόπουλ|μοσχ|ψάρι|αυγ|αβγ)/i.test(food.name);
      if (preference === "lowcarb") return safeNum(food.carbs) <= 12;
      return true;
    });
    const picked = pool[Math.floor(Math.random() * Math.max(pool.length, 1))] || null;
    if (!picked) return;
    const mealKey = `${day}-${mealType}`;
    setCustomMeals((prev) => ({ ...prev, [mealKey]: picked.name }));
  }, [allFoods, preference]);

  const generateMealPlanFromTargets = useCallback(() => {
    const types = ["breakfast", "lunch", "snack", "dinner"];
    const pool = allFoods.filter((food) => {
      if (preference === "vegetarian") return !/(κοτόπουλ|μοσχ|ψάρι|αυγ|αβγ)/i.test(food.name);
      if (preference === "lowcarb") return safeNum(food.carbs) <= 12;
      return true;
    });
    const next = {};
    daysOrder.forEach((day, dayIndex) => {
      types.forEach((mealType, typeIndex) => {
        const food = pool[(dayIndex * types.length + typeIndex) % Math.max(pool.length, 1)];
        if (food?.name) next[`${day}-${mealType}`] = food.name;
      });
    });
    setCustomMeals(next);
  }, [allFoods, daysOrder, preference]);

  const handleGenerateAIPlan = useCallback(() => {
    try {
      generateMealPlanFromTargets();
    } catch (error) {
      console.error("handleGenerateAIPlan:", error?.message || error);
      alert("❌ Αποτυχία δημιουργίας πλάνου.");
    }
  }, [generateMealPlanFromTargets]);

  const foodByName = useMemo(() => createFoodMap(allFoodsFull), [allFoodsFull]);
  const getFood = useCallback((name) => getFoodByName(foodByName, name), [foodByName]);

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

  useNutritionSync({ userId: user?.id, bmr, tdee, protein, fat, carbs, weight, setIntakeHistory });

  const addCustomFood = useCallback(() => {
    if (!canAddFood(newFood)) {
      alert("❌ Παρακαλώ συμπλήρωσε όλα τα πεδία σωστά.");
      return;
    }
    const payload = normalizeFood(newFood);
    setUserFoods((prev) => [...prev, payload]);
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

  const totalMacros = useMemo(() => getTotalMacrosFromMeals(customMeals, foodByName), [customMeals, foodByName]);
  const planKcal = useMemo(() => getTotalKcalFromMeals(customMeals, foodByName), [customMeals, foodByName]);

  const TOKENS = theme === "dark"
    ? {
        panel: "bg-zinc-900/95 border border-zinc-800 text-zinc-100",
        input: "bg-zinc-900 text-zinc-100 border-zinc-800 placeholder-zinc-500",
        row: "bg-zinc-900",
        rowAlt: "bg-zinc-950",
        head: "bg-zinc-800",
        border: "border-zinc-800",
        headText: "text-zinc-100",
        cellText: "text-zinc-200",
      }
    : {
        panel: "bg-white/95 border border-zinc-200 text-zinc-900",
        input: "bg-white text-zinc-900 border-zinc-300 placeholder-zinc-400",
        row: "bg-white",
        rowAlt: "bg-zinc-50",
        head: "bg-zinc-200",
        border: "border-zinc-300",
        headText: "text-zinc-900",
        cellText: "text-zinc-800",
      };

  const sectionStyle = `rounded-2xl p-5 shadow-sm ring-1 ${TOKENS.panel} ${theme === "dark" ? "ring-zinc-800 bg-gradient-to-b from-zinc-900/95 to-zinc-900/75" : "ring-zinc-200 bg-gradient-to-b from-white to-zinc-50"}`;
  const inputStyle = `w-full rounded-md px-3 py-2 border transition-all duration-200 outline-none focus:ring-2 focus:ring-yellow-400 caret-yellow-400 ${theme === "dark" ? "!bg-zinc-900 !text-zinc-100 placeholder:text-zinc-500 border-zinc-800" : "!bg-white !text-zinc-900 placeholder:text-zinc-400 border-zinc-300"}`;
  const rowBg = TOKENS.row;
  const rowAltBg = TOKENS.rowAlt;
  const headBg = TOKENS.head;
  const borderCol = TOKENS.border;
  const headText = TOKENS.headText;
  const cellText = TOKENS.cellText;

  const exportToPDF = async () => {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const el = document.getElementById("nutrition-print") || document.querySelector("#root") || document.body;
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
      const days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"];
      const mealOf = (d, t) => customMeals?.[`${d}-${t}`] ?? "";
      const esc = (v) => {
        const s = String(v ?? "");
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const header = ["Ημέρα", "Πρωινό", "Μεσημεριανό", "Σνακ", "Βραδινό"].map(esc).join(",");
      const rows = days.map((d) => [d, mealOf(d, "breakfast"), mealOf(d, "lunch"), mealOf(d, "snack"), mealOf(d, "dinner")].map(esc).join(","));
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
      .map((day) => `${day}:\n🍽️ Πρωινό: ${mealOf(day, "breakfast")}\n🥗 Μεσημεριανό: ${mealOf(day, "lunch")}\n🥚 Σνακ: ${mealOf(day, "snack")}\n🍝 Βραδινό: ${mealOf(day, "dinner")}`)
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
        className={`min-h-screen px-6 py-10 space-y-10 transition-colors duration-500 ${theme === "dark" ? "bg-black text-zinc-100" : "bg-white text-zinc-900"}`}
      >
        <Helmet>
          <title>Nutrition Module | Health's Spot</title>
          <meta name="description" content="Υπολόγισε BMR, TDEE και διατροφικούς στόχους στο Health's Spot Nutrition Module." />
          <link rel="canonical" href="https://healthsspot.vercel.app/nutrition" />
        </Helmet>

        <div className="sticky top-0 z-50 bg-inherit py-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-yellow-400 drop-shadow text-center">🧪 Nutrition Lab</h1>
          <div className="text-center mt-2">
            <button
              onClick={() => setSimpleView(!simpleView)}
              className="bg-yellow-300 hover:bg-yellow-400 text-black text-sm font-medium px-3 py-1 rounded"
            >
              {simpleView ? "💡 Προηγμένη Έκδοση" : "✨ Απλοποιημένη Έκδοση"}
            </button>
          </div>
        </div>

        <div className="max-w-xl mx-auto space-y-10">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium">
              🎛️ Προτιμήσεις:
              <span className="ml-1 text-xs text-gray-500" title="Ορίζει το διατροφικό μοτίβο π.χ. vegetarian ή χαμηλό σε υδατάνθρακες">ℹ️</span>
            </label>
            <select
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              className={`p-2 rounded w-full border text-sm ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
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
                  setDaysOrder(DEFAULT_DAYS_ORDER);
                  setCarbs(null);
                  setWeight(70);
                  setHeight(175);
                  setAge(25);
                  setGender("male");
                  setActivity(1.55);
                  setBmr(null);
                  setTdee(null);
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

            <button onClick={toggleTheme} className="text-2xl hover:text-yellow-400 transition" title="Αλλαγή Θέματος">
              {theme === "dark" ? "☀" : "🌙"}
            </button>
          </div>

          <BmrTdeeSection
            sectionStyle={sectionStyle}
            theme={theme}
            inputStyle={inputStyle}
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

        <TabsCompo activeTab="🥗 Γεύματα" tabs={["📊 AI Προτάσεις", "🥗 Γεύματα", "📈 Σύγκριση"]} />

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
        />

        <div>
          <PlanDayCard day={daysOrder[0]} customMeals={customMeals} allFoods={allFoodsFull} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {daysOrder.map((day) => (
              <PlanDayCard key={day} day={day} customMeals={customMeals} allFoods={allFoodsFull} />
            ))}
          </div>
        </div>

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
          allFoodsFull={allFoodsFull}
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
        />

        <MealPlannerSection
          daysOrder={daysOrder}
          setDaysOrder={setDaysOrder}
          customMeals={customMeals}
          setCustomMeals={setCustomMeals}
          allFoodsFull={allFoodsFull}
          handleReplacement={handleReplacement}
          theme={theme}
          borderCol={borderCol}
          panelClass={panelClass}
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
      </motion.div>
    </>
  );
}
