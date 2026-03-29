import { useEffect, useRef, useState } from "react";
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
  const [syncStatus, setSyncStatus] = useState(userId ? "fetching" : "offline");
  const [lastSyncAt, setLastSyncAt] = useState(null);

  useEffect(() => {
    if (!userId) {
      setSyncStatus("offline");
      setLastSyncAt(null);
      setIntakeHistory([]);
      return;
    }

    setSyncStatus((current) => (current === "synced" ? current : "fetching"));

    let isMounted = true;

    (async () => {
      try {
        const history = await fetchIntakeHistory({ userId });
        if (isMounted) {
          setIntakeHistory(history);
          setSyncStatus((current) => ((current === "pending" || current === "synced") ? current : "ready"));
        }
      } catch (error) {
        console.error("useNutritionSync.fetchIntakeHistory:", error?.message || error);
        if (isMounted) {
          setSyncStatus("error");
          setIntakeHistory([]);
        }
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
    if (!okNums) {
      setSyncStatus((current) => (current === "offline" ? current : "ready"));
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const syncKey = JSON.stringify([
      today,
      Math.round(safeNum(tdee)),
      Math.round(safeNum(protein) * safeNum(weight)),
      Math.round(safeNum(fat) * safeNum(weight)),
      Math.round(safeNum(carbs)),
    ]);

    if (lastSyncKeyRef.current === syncKey) return;

    setSyncStatus("pending");

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
        setLastSyncAt(new Date().toISOString());
        setSyncStatus("synced");
      } catch (error) {
        console.error("useNutritionSync.upsertNutritionSnapshot:", error?.message || error);
        setSyncStatus("error");
      }
    }, 400);

    return () => clearTimeout(id);
  }, [userId, bmr, tdee, protein, fat, carbs, weight]);

  return { syncStatus, lastSyncAt };
}
