import "server-only";

import { createClient } from "@supabase/supabase-js";

const requiredKeys = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"] as const;

export function dataProvider() {
  const present = requiredKeys.filter((key) => Boolean(process.env[key]));
  if (present.length > 0 && present.length !== requiredKeys.length) {
    throw new Error(`Incomplete Supabase configuration. Set ${requiredKeys.join(", ")} together.`);
  }
  return present.length === requiredKeys.length ? "supabase" : "local-file";
}

export function isSupabaseConfigured() {
  return dataProvider() === "supabase";
}

export function storageBucket() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return process.env.SUPABASE_STORAGE_BUCKET!;
}

export function supabaseAdmin() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
