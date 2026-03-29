import { supabase } from "../supabaseClient";

const EMPTY_MEALS = {};
const EMPTY_HISTORY = [];

export async function saveMealsToSupabase({ userId, customMeals }) {
  if (!userId) return;

  const entries = Object.entries(customMeals || {})
    .map(([key, meal_name]) => {
      const [day, meal_type] = key.split("-");
      return { user_id: userId, day, meal_type, meal_name };
    })
    .filter((row) => row.meal_name);

  const { error: deleteError } = await supabase
    .from("meals")
    .delete()
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  if (!entries.length) return;

  const { error: insertError } = await supabase.from("meals").insert(entries);
  if (insertError) throw insertError;
}

export async function loadMealsFromSupabase({ userId }) {
  if (!userId) return EMPTY_MEALS;

  const { data, error } = await supabase
    .from("meals")
    .select("day, meal_type, meal_name")
    .eq("user_id", userId);

  if (error) throw error;

  const restored = {};
  (data || []).forEach(({ day, meal_type, meal_name }) => {
    restored[`${day}-${meal_type}`] = meal_name;
  });

  return restored;
}

export async function savePlanToSupabase({ userId, customMeals }) {
  if (!userId) return;

  const { error } = await supabase.from("meal_plans").insert([
    { user_id: userId, plan_data: customMeals || {} },
  ]);

  if (error) throw error;
}

export async function loadPlanFromSupabase({ userId }) {
  if (!userId) return EMPTY_MEALS;

  const { data, error } = await supabase
    .from("meal_plans")
    .select("plan_data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data?.plan_data || EMPTY_MEALS;
}

export async function fetchIntakeHistory({ userId }) {
  if (!userId) return EMPTY_HISTORY;

  const { data, error } = await supabase
    .from("intake_logs")
    .select("date, kcal")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) throw error;
  return data || EMPTY_HISTORY;
}

export async function upsertNutritionSnapshot({
  userId,
  today,
  bmr,
  tdee,
  protein,
  fat,
  carbs,
  weight,
}) {
  if (!userId) return;

  const totalProtein = Number(protein) * Number(weight);
  const totalFat = Number(fat) * Number(weight);

  const { error: nutritionError } = await supabase.from("nutrition_data").upsert({
    user_id: userId,
    week: 1,
    bmr: Number(bmr),
    vo2: null,
    protein: Number.isFinite(totalProtein) ? totalProtein : 0,
    carbs: Number.isFinite(Number(carbs)) ? Number(carbs) : 0,
    fat: Number.isFinite(totalFat) ? totalFat : 0,
    stress_monday: null,
    stress_tuesday: null,
  });

  if (nutritionError) throw nutritionError;

  const { error: intakeError } = await supabase.from("intake_logs").upsert({
    user_id: userId,
    date: today,
    kcal: Number.isFinite(Number(tdee)) ? Number(tdee) : 0,
    protein: Number.isFinite(totalProtein) ? totalProtein : 0,
    carbs: Number.isFinite(Number(carbs)) ? Number(carbs) : 0,
    fat: Number.isFinite(totalFat) ? totalFat : 0,
  });

  if (intakeError) throw intakeError;
}
