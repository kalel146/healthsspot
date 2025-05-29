import { supabase } from "./supabaseClient";

export async function fetchCardioLogs(activityFilter = null) {
  let query = supabase
    .from("cardio_logs")
    .select("id, type, Vo2, kCal, created_at")
    .order("created_at", { ascending: false });

  if (activityFilter && activityFilter !== "Όλα") {
    query = query.eq("type", activityFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase fetch error:", error.message);
    return [];
  }

  return data.map((entry) => ({
    id: entry.id,
    activity: entry.type,
    date: new Date(entry.created_at).toLocaleDateString("el-GR"),
    VO2: entry.Vo2 ?? "-",
    kcal: entry.kCal ?? "-",
  }));
}
