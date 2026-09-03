import { getOptionalEnv } from "@/lib/env";
import { getSupabaseServerSecretKey } from "@/lib/supabase";

export function getIntegrationStatus() {
  return {
    supabase: Boolean(
      getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") &&
        getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
        getSupabaseServerSecretKey()
    ),
    notion: Boolean(getOptionalEnv("NOTION_API_KEY") && getOptionalEnv("NOTION_GUIDES_DATABASE_ID")),
    googleSheets: Boolean(getOptionalEnv("GOOGLE_APPS_SCRIPT_WEBHOOK_URL"))
  };
}
