import { createClient } from "@supabase/supabase-js";

// ------------------------------------------------------
// ΑΝΑΓΝΩΣΗ ENV
// ------------------------------------------------------
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("❌ Missing Supabase env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
}

// ------------------------------------------------------
// HARDENED SINGLETON (works with Vite HMR / Fast Refresh)
// ------------------------------------------------------
const w = typeof window !== "undefined" ? window : globalThis;

// Χρησιμοποίησε ΣΤΑΘΕΡΟ μοναδικό storageKey για όλη την app
const AUTH_STORAGE_KEY = "hs-auth";

// Αν υπάρχει ήδη client στο window, χρησιμοποίησέ τον
if (!w.__hs_supabase_client) {
  // Αν άλλος client έχει ήδη δεσμεύσει το ίδιο storageKey (π.χ. παλιός κώδικας),
  // καθάρισε το token για να αποφύγεις διπλά instances
  try {
    const existing = localStorage.getItem(`sb-${AUTH_STORAGE_KEY}-auth-token`);
    if (existing) {
      // προαιρετικό: κρατάμε το session, αλλά δεν είναι απαραίτητο
      // Αν βλέπεις ξανά warning, κάνε clear storage μια φορά.
    }
  } catch {}

  w.__hs_supabase_client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  console.log("✅ Supabase client initialized (singleton)");
} else {
  console.log("♻️ Reusing existing Supabase client (singleton)");
}

export const supabase = w.__hs_supabase_client;
