import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ksanEvents } from "@/lib/events";
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

function startsAtFromDefaultEvent(date: string, time: string) {
  const timeMatch = time.match(/(\d{1,2}):(\d{2})/);
  const hour = timeMatch?.[1]?.padStart(2, "0") ?? "12";
  const minute = timeMatch?.[2] ?? "00";
  return `${date}T${hour}:${minute}:00.000Z`;
}

export async function GET() {
  if (!hasSupabaseConfig() || !getSupabaseServerSecretKey()) {
    return NextResponse.json({
      supabase: false,
      databaseReady: false,
      guideCount: 0,
      businessPostCount: 0,
      eventCount: ksanEvents.length,
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
      recentMembers,
      upcomingEvents,
      urgentBusinessPosts,
      newMembers
    ] = await Promise.all([
      tableCount(supabase, "guide_posts"),
      tableCount(supabase, "business_posts"),
      tableCount(supabase, "events"),
      tableCount(supabase, "profiles"),
      recentTableCount(supabase, "profiles", since),
      supabase.from("events").select("id,title,starts_at,published").gte("starts_at", today.toISOString()).order("starts_at", { ascending: true }).limit(3),
      supabase.from("business_posts").select("id,title,company,deadline,published").gte("deadline", todayDate).lte("deadline", nextWeekDate).order("deadline", { ascending: true }).limit(3),
      supabase.from("profiles").select("id,email,full_name,school,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5)
    ]);
    const allResults: QueryResult[] = [
      guides,
      businessPosts,
      events,
      members,
      recentMembers,
      upcomingEvents,
      urgentBusinessPosts,
      newMembers
    ];
    const errors = allResults
      .map((result) => typeof result.error === "string" ? result.error : result.error?.message)
      .filter(Boolean);
    const defaultUpcomingEvents = ksanEvents
      .filter((event) => event.status === "upcoming")
      .map((event) => ({
        href: `/admin/events/${event.id}/edit`,
        id: event.id,
        published: true,
        startsAt: startsAtFromDefaultEvent(event.date, event.time),
        title: event.title
      }));
    const dashboardUpcomingEvents = [
      ...defaultUpcomingEvents,
      ...((upcomingEvents.data ?? []) as Record<string, unknown>[]).map((event) => ({
        href: `/admin/events/${event.id}/edit`,
        id: String(event.id),
        published: Boolean(event.published),
        startsAt: itemDate(event.starts_at),
        title: String(event.title ?? "제목 없음")
      }))
    ]
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      .slice(0, 3);

    return NextResponse.json({
      supabase: true,
      databaseReady: errors.length === 0,
      guideCount: guides.count,
      businessPostCount: businessPosts.count,
      eventCount: events.count + ksanEvents.length,
      memberCount: members.count,
      recentMemberCount: recentMembers.count,
      upcomingEvents: dashboardUpcomingEvents,
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
      eventCount: ksanEvents.length,
      memberCount: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
