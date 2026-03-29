import { useEffect, useRef } from "react";
import { safeNum } from "../utils/nutritionCalculations";
import { fetchIntakeHistory, upsertNutritionSnapshot } from "../services/nutritionSupabase";

export function useNutritionSync({
  userId,
  bmr,
  tdee,
  protein,
  fat,
  carbs,
  weight,
  setIntakeHistory,
}) {
  const lastSyncKeyRef = useRef("");

  useEffect(() => {
    if (!userId) {
      setIntakeHistory([]);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const history = await fetchIntakeHistory({ userId });
        if (isMounted) setIntakeHistory(history);
      } catch (error) {
        console.error("useNutritionSync.fetchIntakeHistory:", error?.message || error);
        if (isMounted) setIntakeHistory([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [userId, setIntakeHistory]);

  useEffect(() => {
    if (!userId) return;

    const okNums = [bmr, tdee, protein, fat, carbs, weight].every((value) =>
      Number.isFinite(Number(value))
    );
    if (!okNums) return;

    const today = new Date().toISOString().split("T")[0];
    const syncKey = JSON.stringify([
      today,
      Math.round(safeNum(tdee)),
      Math.round(safeNum(protein) * safeNum(weight)),
      Math.round(safeNum(fat) * safeNum(weight)),
      Math.round(safeNum(carbs)),
    ]);

    if (lastSyncKeyRef.current === syncKey) return;

    const id = setTimeout(async () => {
      try {
        await upsertNutritionSnapshot({
          userId,
          today,
          bmr,
          tdee,
          protein,
          fat,
          carbs,
          weight,
        });
        lastSyncKeyRef.current = syncKey;
      } catch (error) {
        console.error("useNutritionSync.upsertNutritionSnapshot:", error?.message || error);
      }
    }, 400);

    return () => clearTimeout(id);
  }, [userId, bmr, tdee, protein, fat, carbs, weight]);
}
