import fs from "fs";

const inputPath = process.argv[2] || "./defaultMeals.json";
const outputPath = process.argv[3] || "./defaultMeals.normalized.json";

const raw = fs.readFileSync(inputPath, "utf8");
const meals = JSON.parse(raw);

const SLOT_TAGS = [
  "για πρωινό",
  "σνακ",
  "για μεσημεριανό",
  "για βραδινό",
];

const SOURCE_TAGS = [
  "κοτόπουλο",
  "γαλοπούλα",
  "μοσχάρι",
  "τόνος",
  "σολομός",
  "αυγά",
  "γαρίδες",
  "tofu",
  "φακές",
  "ρεβίθια",
  "φασόλια",
  "γιαούρτι",
  "cottage",
];

const FUNCTION_TAGS = [
  "υψηλή πρωτεΐνη",
  "για δίαιτα",
  "lowcarb",
  "vegetarian",
  "γρήγορο",
  "post-workout",
  "υγιεινό",
  "για ενέργεια",
];

const TAG_ALIASES = {
  "πλούσιο σε φυτικές ίνες": "υγιεινό",
  "χαμηλό σε υδατάνθρακες": "lowcarb",
  "πλούσιο σε πρωτεΐνη": "υψηλή πρωτεΐνη",
  "κετογονικό": "lowcarb",
};

function unique(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function normalizeTag(tag) {
  const clean = String(tag || "").trim();
  return TAG_ALIASES[clean] || clean;
}

function inferSourceTags(name) {
  const n = String(name || "").toLowerCase();
  const found = [];

  if (/(κοτόπουλο|chicken)/i.test(n)) found.push("κοτόπουλο");
  if (/(γαλοπούλα|turkey)/i.test(n)) found.push("γαλοπούλα");
  if (/(μοσχάρι|μοσχαρ|beef)/i.test(n)) found.push("μοσχάρι");
  if (/(τόνος|tuna)/i.test(n)) found.push("τόνος");
  if (/(σολομός|salmon)/i.test(n)) found.push("σολομός");
  if (/(ομελέτα|αυγ|scrambled egg|eggs?)/i.test(n)) found.push("αυγά");
  if (/(γαρίδ|shrimp|prawn)/i.test(n)) found.push("γαρίδες");
  if (/(tofu)/i.test(n)) found.push("tofu");
  if (/(φακ)/i.test(n)) found.push("φακές");
  if (/(ρεβιθ)/i.test(n)) found.push("ρεβίθια");
  if (/(φασόλ)/i.test(n)) found.push("φασόλια");
  if (/(γιαούρτι|skyr|κεφίρ|yogurt)/i.test(n)) found.push("γιαούρτι");
  if (/(cottage)/i.test(n)) found.push("cottage");

  return unique(found);
}

function inferFunctionalTags(meal) {
  const tags = [];

  if (Number(meal.protein) >= 25) tags.push("υψηλή πρωτεΐνη");
  if (Number(meal.carbs) <= 15) tags.push("lowcarb");

  const existing = (meal.tags || []).map(normalizeTag);

  if (existing.includes("vegetarian")) tags.push("vegetarian");
  if (existing.includes("γρήγορο")) tags.push("γρήγορο");
  if (existing.includes("post-workout")) tags.push("post-workout");
  if (existing.includes("υγιεινό")) tags.push("υγιεινό");
  if (existing.includes("για δίαιτα")) tags.push("για δίαιτα");
  if (existing.includes("για ενέργεια")) tags.push("για ενέργεια");

  return unique(tags);
}

function findSlotTag(tags, mealName) {
  const slotMatches = tags.filter((t) => SLOT_TAGS.includes(t));
  if (slotMatches.length !== 1) {
    throw new Error(
      `Το meal "${mealName}" έχει ${slotMatches.length} slot tags. Πρέπει να έχει ακριβώς 1.`
    );
  }
  return slotMatches[0];
}

function kcalFromMacros(meal) {
  return Number(meal.protein) * 4 + Number(meal.fat) * 9 + Number(meal.carbs) * 4;
}

function orderedTags(slot, sources, funcs, extras = []) {
  const normalizedExtras = extras
    .map(normalizeTag)
    .filter(
      (t) =>
        !SLOT_TAGS.includes(t) &&
        !SOURCE_TAGS.includes(t) &&
        !FUNCTION_TAGS.includes(t)
    );

  return unique([
    slot,
    ...sources,
    ...funcs,
    ...normalizedExtras,
  ]);
}

const normalizedMeals = meals.map((meal) => {
  const rawTags = unique((meal.tags || []).map(normalizeTag));
  const slot = findSlotTag(rawTags, meal.name);
  const sources = inferSourceTags(meal.name);
  const funcs = inferFunctionalTags(meal);

  const normalized = {
    ...meal,
    tags: orderedTags(slot, sources, funcs, rawTags),
  };

  const calcKcal = kcalFromMacros(meal);
  if (Math.abs(calcKcal - Number(meal.kcal)) > 10) {
    console.warn(
      `⚠️ Kcal mismatch στο "${meal.name}": file=${meal.kcal}, calc=${calcKcal}`
    );
  }

  return normalized;
});

fs.writeFileSync(outputPath, JSON.stringify(normalizedMeals, null, 2), "utf8");

console.log(`✅ Έτοιμο: ${outputPath}`);
console.log(`Meals: ${normalizedMeals.length}`);