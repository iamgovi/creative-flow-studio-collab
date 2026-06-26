import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

type AppSupabaseClient = SupabaseClient<Database>;

let client: AppSupabaseClient | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}

export function createSupabaseAppClient(config: SupabaseConfig): AppSupabaseClient {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function getSupabaseClient(): AppSupabaseClient {
  if (!client) {
    client = createSupabaseAppClient(getSupabaseConfig());
  }

  return client;
}
