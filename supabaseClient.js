// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const AUTH_STORAGE_KEY = "hs-auth";
const g = globalThis;

function createNoopSupabaseError() {
  return {
    name: "SupabaseUnavailableError",
    message: "Missing Supabase env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)",
  };
}

function createNoopQuery(error = createNoopSupabaseError()) {
  const self = {
    select: () => self,
    insert: () => self,
    update: () => self,
    upsert: () => self,
    delete: () => self,
    eq: () => self,
    order: () => self,
    limit: () => self,
    maybeSingle: async () => ({ data: null, error }),
    single: async () => ({ data: null, error }),
    then: (resolve, reject) => Promise.resolve({ data: null, error }).then(resolve, reject),
    catch: (reject) => Promise.resolve({ data: null, error }).catch(reject),
    finally: (callback) => Promise.resolve({ data: null, error }).finally(callback),
  };

  return self;
}

function createNoopSupabase() {
  const error = createNoopSupabaseError();
  return {
    __isNoop: true,
    from() {
      return createNoopQuery(error);
    },
  };
}

let supabase = import.meta?.hot?.data?.__hs_supabase_client;

if (!supabase) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[Health's Spot] Supabase env missing. Falling back to offline/noop client.");
    supabase = g.__hs_supabase_client ?? createNoopSupabase();
  } else {
    supabase = g.__hs_supabase_client ?? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storageKey: AUTH_STORAGE_KEY,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  if (import.meta?.hot) {
    import.meta.hot.data.__hs_supabase_client = supabase;
  }
  if (!g.__hs_supabase_client) g.__hs_supabase_client = supabase;
}

export { supabase };
export default supabase;
