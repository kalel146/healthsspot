export const isValidMacroNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
};

export const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

export const isValidFood = (item) => {
  return (
    item &&
    isNonEmptyString(item.name) &&
    isValidMacroNumber(item.protein) &&
    isValidMacroNumber(item.fat) &&
    isValidMacroNumber(item.carbs)
  );
};

export const normalizeFood = (food) => ({
  name: String(food?.name || "").trim(),
  protein: Math.max(0, Number(food?.protein) || 0),
  fat: Math.max(0, Number(food?.fat) || 0),
  carbs: Math.max(0, Number(food?.carbs) || 0),
});

export const canAddFood = (food) => isValidFood(food);

export const validateFoodOrThrow = (food) => {
  if (!isValidFood(food)) {
    throw new Error("Invalid food payload");
  }
  return normalizeFood(food);
};

export const parseMacrosText = (text) => {
  const [protein = 0, fat = 0, carbs = 0] = String(text || "")
    .split("/")
    .map((v) => Number(v.trim()));

  return {
    protein: Number.isFinite(protein) ? protein : 0,
    fat: Number.isFinite(fat) ? fat : 0,
    carbs: Number.isFinite(carbs) ? carbs : 0,
  };
};

export const isValidMealKey = (value) => {
  return typeof value === "string" && value.includes("-") && value.trim().length > 2;
};
