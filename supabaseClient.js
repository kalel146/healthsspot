// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("❌ Missing Supabase env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
}

// ΈΝΑΣ client σε όλο το περιβάλλον (παράθυρο + HMR)
const AUTH_STORAGE_KEY = "hs-auth";
const g = globalThis;

// 1) Προτίμησε HMR cache (Vite) — αποτρέπει re-creation σε hot reload
let supabase = import.meta?.hot?.data?.__hs_supabase_client;
if (!supabase) {
  // 2) Αν δεν υπάρχει, δες “παγκόσμιο” singleton (tabs/iframes)
  supabase = g.__hs_supabase_client ?? createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storageKey: AUTH_STORAGE_KEY,       // σταθερό, δικό σου
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  // Γράψε το instance σε HMR cache & global singleton
  if (import.meta?.hot) {
    import.meta.hot.data.__hs_supabase_client = supabase;
  }
  if (!g.__hs_supabase_client) g.__hs_supabase_client = supabase;

  // Προαιρετικό log για debug:
  // console.log("✅ Supabase client ready (singleton/HMR-safe)");
} else {
  // console.log("♻️ Reusing Supabase client from HMR cache");
}

export { supabase };
export default supabase;
