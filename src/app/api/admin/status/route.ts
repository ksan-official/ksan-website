import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceSupabaseClient, getSupabaseServerSecretKey, hasSupabaseConfig } from "@/lib/supabase";

type QueryResult = {
  error?: { message?: string } | string | null;
};

async function tableCount(supabase: SupabaseClient, table: string) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  return {
    count: count ?? 0,
    error: error?.message
  };
}

async function filteredCount(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: unknown
) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, value);

  return {
    count: count ?? 0,
    error: error?.message
  };
}

async function recentTableCount(supabase: SupabaseClient, table: string, since: string) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);

  return {
    count: count ?? 0,
    error: error?.message
  };
}

function itemDate(value: unknown) {
  return typeof value === "string" ? value : "";
}

function mapRecentItem(type: string, href: string, item: Record<string, unknown>) {
  return {
    href,
    id: String(item.id ?? item.slug ?? href),
    title: String(item.title ?? "제목 없음"),
    type,
    updatedAt: itemDate(item.updated_at ?? item.created_at)
  };
}

export async function GET() {
  if (!hasSupabaseConfig() || !getSupabaseServerSecretKey()) {
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
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date();
    const todayDate = today.toISOString().slice(0, 10);
    const nextWeekDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const [
      guides,
      businessPosts,
      events,
      members,
      recentGuides,
      recentBusinessPosts,
      recentEvents,
      recentMembers,
      pendingGuides,
      pendingBusinessPosts,
      pendingEvents,
      recentGuideItems,
      recentBusinessItems,
      recentEventItems,
      upcomingEvents,
      urgentBusinessPosts,
      newMembers
    ] = await Promise.all([
      tableCount(supabase, "guide_posts"),
      tableCount(supabase, "business_posts"),
      tableCount(supabase, "events"),
      tableCount(supabase, "profiles"),
      recentTableCount(supabase, "guide_posts", since),
      recentTableCount(supabase, "business_posts", since),
      recentTableCount(supabase, "events", since),
      recentTableCount(supabase, "profiles", since),
      filteredCount(supabase, "guide_posts", "published", false),
      filteredCount(supabase, "business_posts", "published", false),
      filteredCount(supabase, "events", "published", false),
      supabase.from("guide_posts").select("id,slug,title,updated_at").order("updated_at", { ascending: false }).limit(5),
      supabase.from("business_posts").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(5),
      supabase.from("events").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(5),
      supabase.from("events").select("id,title,starts_at,published").gte("starts_at", today.toISOString()).order("starts_at", { ascending: true }).limit(3),
      supabase.from("business_posts").select("id,title,company,deadline,published").gte("deadline", todayDate).lte("deadline", nextWeekDate).order("deadline", { ascending: true }).limit(3),
      supabase.from("profiles").select("id,email,full_name,school,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5)
    ]);
    const allResults: QueryResult[] = [
      guides,
      businessPosts,
      events,
      members,
      recentGuides,
      recentBusinessPosts,
      recentEvents,
      recentMembers,
      pendingGuides,
      pendingBusinessPosts,
      pendingEvents,
      recentGuideItems,
      recentBusinessItems,
      recentEventItems,
      upcomingEvents,
      urgentBusinessPosts,
      newMembers
    ];
    const errors = allResults
      .map((result) => typeof result.error === "string" ? result.error : result.error?.message)
      .filter(Boolean);
    const recentUpdates = [
      ...((recentGuideItems.data ?? []) as Record<string, unknown>[]).map((item) => mapRecentItem("정착가이드", `/admin/guides/${item.id}/edit`, item)),
      ...((recentBusinessItems.data ?? []) as Record<string, unknown>[]).map((item) => mapRecentItem("채용 공고", "/admin/business", item)),
      ...((recentEventItems.data ?? []) as Record<string, unknown>[]).map((item) => mapRecentItem("행사", "/admin/events/new", item))
    ]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6);
    return NextResponse.json({
      supabase: true,
      databaseReady: errors.length === 0,
      guideCount: guides.count,
      businessPostCount: businessPosts.count,
      eventCount: events.count,
      memberCount: members.count,
      recentGuideCount: recentGuides.count,
      recentBusinessPostCount: recentBusinessPosts.count,
      recentEventCount: recentEvents.count,
      recentMemberCount: recentMembers.count,
      pendingGuideCount: pendingGuides.count,
      pendingBusinessPostCount: pendingBusinessPosts.count,
      pendingEventCount: pendingEvents.count,
      recentUpdates,
      upcomingEvents: ((upcomingEvents.data ?? []) as Record<string, unknown>[]).map((event) => ({
        href: "/admin/events/new",
        id: String(event.id),
        published: Boolean(event.published),
        startsAt: itemDate(event.starts_at),
        title: String(event.title ?? "제목 없음")
      })),
      urgentBusinessPosts: ((urgentBusinessPosts.data ?? []) as Record<string, unknown>[]).map((post) => ({
        company: String(post.company ?? ""),
        deadline: itemDate(post.deadline),
        href: "/admin/business",
        id: String(post.id),
        published: Boolean(post.published),
        title: String(post.title ?? "제목 없음")
      })),
      newMembers: ((newMembers.data ?? []) as Record<string, unknown>[]).map((member) => ({
        createdAt: itemDate(member.created_at),
        email: String(member.email ?? ""),
        id: String(member.id),
        name: String(member.full_name ?? member.email ?? "이름 없음"),
        school: String(member.school ?? "")
      })),
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
