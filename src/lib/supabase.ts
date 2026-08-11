import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

let browserSupabaseClient: ReturnType<typeof createClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing required Supabase browser environment variables");
  }
  browserSupabaseClient = createClient(url, key);
  return browserSupabaseClient;
}

export function createServerSupabaseClient(accessToken?: string) {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : undefined
  });
}

export function createServiceSupabaseClient() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
