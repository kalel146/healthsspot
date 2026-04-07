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

export const SLOT_TAG_MAP = {
  breakfast: "για πρωινό",
  lunch: "για μεσημεριανό",
  snack: "σνακ",
  dinner: "για βραδινό",
};

const SLOT_TAGS = new Set(Object.values(SLOT_TAG_MAP));

const FUNCTION_TAGS = new Set([
  "υψηλή πρωτεΐνη",
  "για δίαιτα",
  "lowcarb",
  "vegetarian",
  "γρήγορο",
  "post-workout",
  "υγιεινό",
  "για ενέργεια",
]);

const EXTRA_TAGS = new Set(["custom"]);

const TAG_ALIASES = {
  "πλούσιο σε φυτικές ίνες": "υγιεινό",
  "πλούσιο σε πρωτεΐνη": "υψηλή πρωτεΐνη",
  "χαμηλό σε υδατάνθρακες": "lowcarb",
  "κετογονικό": "lowcarb",
};

const round1 = (value) => Math.round(Number(value || 0) * 10) / 10;

const unique = (arr) => [...new Set((arr || []).filter(Boolean))];

const normalizeTag = (tag) => {
  const clean = String(tag || "").trim().toLowerCase();
  return TAG_ALIASES[clean] || clean;
};

const inferSlotTag = (name, tags, fallbackMealType) => {
  const explicit = tags.find((tag) => SLOT_TAGS.has(tag));
  if (explicit) return explicit;

  const text = `${name} ${tags.join(" ")}`.toLowerCase();

  if (/πρωιν|breakfast/.test(text)) return SLOT_TAG_MAP.breakfast;
  if (/μεσημεριαν|lunch/.test(text)) return SLOT_TAG_MAP.lunch;
  if (/σνακ|snack/.test(text)) return SLOT_TAG_MAP.snack;
  if (/βραδιν|dinner/.test(text)) return SLOT_TAG_MAP.dinner;

  if (fallbackMealType && SLOT_TAG_MAP[fallbackMealType]) {
    return SLOT_TAG_MAP[fallbackMealType];
  }

  return null;
};

const inferSourceTags = (name, tags) => {
  const text = `${name} ${tags.join(" ")}`.toLowerCase();
  const found = [];

  if (/(κοτόπουλο|chicken)/i.test(text)) found.push("κοτόπουλο");
  if (/(γαλοπούλα|turkey)/i.test(text)) found.push("γαλοπούλα");
  if (/(μοσχ|μοσχαρ|beef)/i.test(text)) found.push("μοσχάρι");
  if (/(τόνος|tuna)/i.test(text)) found.push("τόνος");
  if (/(σολομός|σολωμός|salmon)/i.test(text)) found.push("σολομός");
  if (/(αυγ|ομελέτα|scrambled egg|eggs?)/i.test(text)) found.push("αυγά");
  if (/(γαρίδ|shrimp|prawn)/i.test(text)) found.push("γαρίδες");
  if (/(tofu)/i.test(text)) found.push("tofu");
  if (/(φακ)/i.test(text)) found.push("φακές");
  if (/(ρεβιθ)/i.test(text)) found.push("ρεβίθια");
  if (/(φασόλ)/i.test(text)) found.push("φασόλια");
  if (/(γιαούρτι|skyr|κεφίρ|yogurt)/i.test(text)) found.push("γιαούρτι");
  if (/(cottage)/i.test(text)) found.push("cottage");

  return unique(found);
};

const inferFunctionTags = (food, inputTags, sourceTags) => {
  const tags = [];

  if (Number(food.protein) >= 25) tags.push("υψηλή πρωτεΐνη");
  if (Number(food.carbs) <= 15) tags.push("lowcarb");

  if (inputTags.includes("για δίαιτα")) tags.push("για δίαιτα");
  if (inputTags.includes("γρήγορο")) tags.push("γρήγορο");
  if (inputTags.includes("post-workout")) tags.push("post-workout");
  if (inputTags.includes("υγιεινό")) tags.push("υγιεινό");
  if (inputTags.includes("για ενέργεια")) tags.push("για ενέργεια");
  if (inputTags.includes("vegetarian")) tags.push("vegetarian");

  const vegetarianSources = ["tofu", "φακές", "ρεβίθια", "φασόλια"];
  const animalSources = ["κοτόπουλο", "γαλοπούλα", "μοσχάρι", "τόνος", "σολομός", "αυγά", "γαρίδες"];

  const hasVegetarianSource = sourceTags.some((tag) => vegetarianSources.includes(tag));
  const hasAnimalSource = sourceTags.some((tag) => animalSources.includes(tag));

  if (hasVegetarianSource && !hasAnimalSource) {
    tags.push("vegetarian");
  }

  return unique(tags.filter((tag) => FUNCTION_TAGS.has(tag)));
};

export const sanitizeFoodEntry = (food, options = {}) => {
  const { fallbackMealType = null } = options;

  if (!isValidFood(food)) return null;

  const base = normalizeFood(food);
  const inputTags = unique(
    (Array.isArray(food?.tags) ? food.tags : []).map(normalizeTag)
  );

  const slotTag = inferSlotTag(base.name, inputTags, fallbackMealType);
  const sourceTags = inferSourceTags(base.name, inputTags);
  const functionTags = inferFunctionTags(base, inputTags, sourceTags);
  const extraTags = inputTags.filter((tag) => EXTRA_TAGS.has(tag));

  return {
    ...food,
    ...base,
    kcal: round1(base.protein * 4 + base.fat * 9 + base.carbs * 4),
    tags: unique([slotTag, ...sourceTags, ...functionTags, ...extraTags].filter(Boolean)),
  };
};

export const sanitizeFoodCollection = (items, options = {}) => {
  if (!Array.isArray(items)) return [];

  const seen = new Set();
  const out = [];

  items.forEach((item) => {
    const sanitized = sanitizeFoodEntry(item, options);
    if (!sanitized) return;

    const key = sanitized.name.trim().toLowerCase();
    if (!key || seen.has(key)) return;

    seen.add(key);
    out.push(sanitized);
  });

  return out;
};