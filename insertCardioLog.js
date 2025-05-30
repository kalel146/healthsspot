// insertCardioLog.js

import { supabase } from "./supabaseClient";

export async function insertCardioLog({ type, mets, weight, duration, Vo2, kCal, test_type, value, distance }) {
  const { data, error } = await supabase.from("cardio_logs").insert([
    {
      type,
      mets,
      weight,
      duration,
      Vo2,
      kCal,
      test_type,
      value,
      distance
    }
  ]);

  if (error) {
    console.error("❌ Supabase insert error:", error.message);
  } else {
    console.log("✅ Cardio log inserted:", data);
  }
}
