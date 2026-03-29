export const ZERO_FOOD = { name: "", protein: 0, fat: 0, carbs: 0 };
export const ZERO_MACROS = { protein: 0, fat: 0, carbs: 0 };

export const safeNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export const clamp = (v, min, max) => Math.min(Math.max(Number(v), min), max);
export const round1 = (v) => Math.round(Number(v) * 10) / 10;

export const calculateBmr = ({ weight, height, age, gender }) => {
  const W = clamp(safeNum(weight, 70), 30, 250);
  const H = clamp(safeNum(height, 175), 120, 230);
  const A = clamp(safeNum(age, 25), 12, 100);

  return gender === "male"
    ? 10 * W + 6.25 * H - 5 * A + 5
    : 10 * W + 6.25 * H - 5 * A - 161;
};

export const calculateTdee = ({ bmr, activity }) => {
  const ACT = clamp(safeNum(activity, 1.55), 1.2, 1.9);
  return bmr * ACT;
};

export const calculateMacroTargets = ({ weight, proteinPerKg, fatPerKg, tdee }) => {
  const W = safeNum(weight, 70);
  const protein = safeNum(proteinPerKg) * W;
  const fat = safeNum(fatPerKg) * W;
  const kcalFromProtein = protein * 4;
  const kcalFromFat = fat * 9;
  const remainingKcal = Math.max(0, safeNum(tdee) - (kcalFromProtein + kcalFromFat));
  const carbs = remainingKcal / 4;

  return {
    protein: round1(protein),
    fat: round1(fat),
    carbs: round1(Math.max(0, carbs)),
  };
};

export const calculateNutritionSummary = ({
  weight,
  height,
  age,
  gender,
  activity,
  proteinPerKg,
  fatPerKg,
}) => {
  const bmr = calculateBmr({ weight, height, age, gender });
  const tdee = calculateTdee({ bmr, activity });
  const macros = calculateMacroTargets({
    weight,
    proteinPerKg,
    fatPerKg,
    tdee,
  });

  return {
    bmr: round1(bmr),
    tdee: round1(tdee),
    ...macros,
  };
};

export const getFoodKcal = (food) => {
  const p = safeNum(food?.protein);
  const f = safeNum(food?.fat);
  const c = safeNum(food?.carbs);
  return p * 4 + f * 9 + c * 4;
};

export const createFoodMap = (foods = []) => {
  const map = new Map();
  foods.forEach((food) => {
    if (food?.name) map.set(food.name, food);
  });
  return map;
};

export const getFoodByName = (foodMap, name) => {
  return foodMap.get(name) || ZERO_FOOD;
};

export const getTotalMacrosFromMeals = (mealsObj = {}, foodMap) => {
  return Object.values(mealsObj).reduce(
    (acc, mealName) => {
      const food = getFoodByName(foodMap, mealName);
      acc.protein += safeNum(food.protein);
      acc.fat += safeNum(food.fat);
      acc.carbs += safeNum(food.carbs);
      return acc;
    },
    { ...ZERO_MACROS }
  );
};

export const getTotalKcalFromMeals = (mealsObj = {}, foodMap) => {
  return Math.round(
    Object.values(mealsObj).reduce((sum, mealName) => {
      const food = getFoodByName(foodMap, mealName);
      return sum + getFoodKcal(food);
    }, 0)
  );
};

export const getDayMacroSummary = (dayKey, customMealsObj = {}, foodMap) => {
  const mealNames = Object.entries(customMealsObj)
    .filter(([key]) => key.startsWith(dayKey))
    .map(([, value]) => value);

  return mealNames.reduce(
    (acc, mealName) => {
      const food = getFoodByName(foodMap, mealName);
      acc.protein += safeNum(food.protein);
      acc.fat += safeNum(food.fat);
      acc.carbs += safeNum(food.carbs);
      return acc;
    },
    { ...ZERO_MACROS }
  );
};
