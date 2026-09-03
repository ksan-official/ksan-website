import { createClient } from "@supabase/supabase-js";
import { getOptionalEnv, getRequiredEnv } from "@/lib/env";

let browserSupabaseClient: ReturnType<typeof createClient> | null = null;

function getBrowserKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabaseServerSecretKey() {
  return getOptionalEnv("SUPABASE_SECRET_KEY") ?? getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function createBrowserSupabaseClient() {
  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getBrowserKey();
  if (!url || !key) {
    throw new Error("Missing required Supabase browser environment variables");
  }
  browserSupabaseClient = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true
    }
  });
  return browserSupabaseClient;
}

export async function getBrowserSupabaseSession(retries = 5) {
  const supabase = createBrowserSupabaseClient();

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const result = await supabase.auth.getSession();
    if (result.data.session || result.error || attempt === retries) {
      return result;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 120));
  }

  return supabase.auth.getSession();
}

export function createServerSupabaseClient(accessToken?: string) {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getBrowserKey();
  if (!key) {
    throw new Error("Missing Supabase publishable/anon key");
  }
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
  const key = getSupabaseServerSecretKey();
  if (!key) {
    throw new Error("Missing Supabase secret/service role key");
  }
  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      getBrowserKey()
  );
}
