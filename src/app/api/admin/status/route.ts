import { NextResponse } from "next/server";
import { createServiceSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export async function GET() {
  if (!hasSupabaseConfig() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      supabase: false,
      databaseReady: false,
      guideCount: 0
    });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { count, error } = await supabase
      .from("guide_posts")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      supabase: true,
      databaseReady: !error,
      guideCount: count ?? 0,
      error: error?.message
    });
  } catch (error) {
    return NextResponse.json({
      supabase: true,
      databaseReady: false,
      guideCount: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
