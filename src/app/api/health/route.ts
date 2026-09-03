import { NextResponse } from "next/server";
import { getOptionalEnv } from "@/lib/env";
import { getSupabaseServerSecretKey, hasSupabaseConfig } from "@/lib/supabase";

export function GET() {
  const requiredSupabaseEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY"
  ];
  const missingSupabaseEnv = requiredSupabaseEnv.filter((name) => {
    if (name === "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY") {
      return !getSupabaseServerSecretKey();
    }
    return !getOptionalEnv(name);
  });

  return NextResponse.json({
    ok: true,
    integrations: {
      supabase: hasSupabaseConfig(),
      notion: Boolean(getOptionalEnv("NOTION_API_KEY") && getOptionalEnv("NOTION_GUIDES_DATABASE_ID")),
      googleSheets: Boolean(getOptionalEnv("GOOGLE_APPS_SCRIPT_WEBHOOK_URL"))
    },
    missing: {
      supabase: missingSupabaseEnv
    }
  });
}
