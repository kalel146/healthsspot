import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("🔍 SUPABASE_URL:", supabaseUrl);
console.log("🔍 SUPABASE_KEY:", supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log("✅ Supabase client initialized successfully");