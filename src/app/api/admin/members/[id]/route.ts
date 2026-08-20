import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function accessToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

function missingTable(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes("could not find the table"));
}

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  const { id } = await context.params;
  const { data: member, error: memberError } = await admin.serviceClient
    .from("profiles")
    .select("id,email,full_name,school,major,admission_year,role,created_at")
    .eq("id", id)
    .single();

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });
  if (!member) return NextResponse.json({ error: "회원을 찾지 못했습니다." }, { status: 404 });

  const [savedGuidesResult, savedBusinessPostsResult, savedBusinessItemsResult, applicationsResult] =
    await Promise.all([
      admin.serviceClient
        .from("saved_guides")
        .select("guide_slug,created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      admin.serviceClient
        .from("saved_business_posts")
        .select("created_at,business_posts(id,title,company)")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      admin.serviceClient
        .from("saved_business_items")
        .select("job_id,created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      admin.serviceClient
        .from("applications")
        .select("id,application_type,target_id,full_name,email,school,major,admission_year,message,submitted_at,sheets_sync_status")
        .eq("user_id", id)
        .order("submitted_at", { ascending: false })
    ]);

  const savedGuideSlugs = (savedGuidesResult.data ?? []).map((item) => item.guide_slug);
  const { data: guidePosts, error: guidePostsError } = savedGuideSlugs.length
    ? await admin.serviceClient
        .from("guide_posts")
        .select("slug,title,category,published")
        .in("slug", savedGuideSlugs)
    : { data: [], error: null };
  const guideBySlug = new Map((guidePosts ?? []).map((guide) => [guide.slug, guide]));

  const errors = [
    savedGuidesResult.error,
    savedBusinessPostsResult.error,
    missingTable(savedBusinessItemsResult.error) ? null : savedBusinessItemsResult.error,
    applicationsResult.error,
    guidePostsError
  ].filter(Boolean);

  if (errors.length) {
    return NextResponse.json({ error: errors.map((error) => error?.message).join(" / ") }, { status: 500 });
  }

  return NextResponse.json({
    member,
    activity: {
      savedGuides: (savedGuidesResult.data ?? []).map((item) => ({
        slug: item.guide_slug,
        title: guideBySlug.get(item.guide_slug)?.title ?? item.guide_slug,
        category: guideBySlug.get(item.guide_slug)?.category ?? "정착가이드",
        published: guideBySlug.get(item.guide_slug)?.published ?? null,
        savedAt: item.created_at
      })),
      savedBusinessPosts: (savedBusinessPostsResult.data ?? []).map((item) => {
        const post = Array.isArray(item.business_posts) ? item.business_posts[0] : item.business_posts;
        return {
          id: post?.id ?? null,
          title: post?.title ?? "삭제되었거나 찾을 수 없는 공고",
          company: post?.company ?? null,
          savedAt: item.created_at
        };
      }),
      savedBusinessItems: missingTable(savedBusinessItemsResult.error) ? [] : savedBusinessItemsResult.data ?? [],
      applications: applicationsResult.data ?? [],
      writtenPosts: []
    }
  });
}
