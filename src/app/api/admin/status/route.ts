import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

async function tableCount(supabase: SupabaseClient, table: string) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  return {
    count: count ?? 0,
    error: error?.message
  };
}

export async function GET() {
  if (!hasSupabaseConfig() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      supabase: false,
      databaseReady: false,
      guideCount: 0,
      businessPostCount: 0,
      eventCount: 0,
      memberCount: 0
    });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const [guides, businessPosts, events, members] = await Promise.all([
      tableCount(supabase, "guide_posts"),
      tableCount(supabase, "business_posts"),
      tableCount(supabase, "events"),
      tableCount(supabase, "profiles")
    ]);
    const errors = [guides, businessPosts, events, members]
      .map((result) => result.error)
      .filter(Boolean);

    return NextResponse.json({
      supabase: true,
      databaseReady: errors.length === 0,
      guideCount: guides.count,
      businessPostCount: businessPosts.count,
      eventCount: events.count,
      memberCount: members.count,
      error: errors.join(" / ") || undefined
    });
  } catch (error) {
    return NextResponse.json({
      supabase: true,
      databaseReady: false,
      guideCount: 0,
      businessPostCount: 0,
      eventCount: 0,
      memberCount: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
