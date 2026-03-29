export const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const fmtG = (v) => (Number.isFinite(v) ? `${v}g` : "—");

export const formatKcal = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? `${n} kcal` : "—";
};

export const kcalOf = (item) => {
  const p = toNum(item?.protein);
  const f = toNum(item?.fat);
  const c = toNum(item?.carbs);
  return formatKcal(p * 4 + f * 9 + c * 4);
};

export const getProteinLabel = (v) =>
  v < 1.2 ? "Χαμηλή" : v < 2 ? "Μέτρια" : "Υψηλή";

export const getFatLabel = (v) =>
  v < 0.6 ? "Πολύ χαμηλά" : v < 1.2 ? "Μέτρια" : "Υψηλά";

export const formatMacroLine = ({ protein = 0, fat = 0, carbs = 0 }) => {
  return `${toNum(protein)}g P / ${toNum(fat)}g F / ${toNum(carbs)}g C`;
};

export const formatMacroTargetsLine = ({ protein = 0, fat = 0, carbs = 0 }) => {
  return `🎯 Στόχος: ${toNum(protein).toFixed(1)}g P, ${toNum(fat).toFixed(1)}g F, ${toNum(carbs).toFixed(1)}g C`;
};

export const formatMacroActualLine = ({ protein = 0, fat = 0, carbs = 0 }) => {
  return `📦 Πλάνο: ${toNum(protein).toFixed(1)}g P / ${toNum(fat).toFixed(1)}g F / ${toNum(carbs).toFixed(1)}g C`;
};

export const formatMacroDeltaLine = ({ protein = 0, fat = 0, carbs = 0 }) => {
  return `✏️ Διαφορά: ${toNum(protein).toFixed(1)} P / ${toNum(fat).toFixed(1)} F / ${toNum(carbs).toFixed(1)} C`;
};
