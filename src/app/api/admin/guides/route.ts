import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { deriveSummary, parseGuideText, slugFromTitle } from "@/lib/guideParser";
import { resolveGuideCategory } from "@/lib/guide-structure";
import { extractHashTagsFromText, mergeGuideTags, parseGuideTags } from "@/lib/guideTags";
import { buildGuideTocHeadings } from "@/lib/guideToc";
import { getNotionPageFromUrl } from "@/lib/notion";

function notionError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown Notion error";
  if (message.includes("401") || message.includes("403") || message.includes("404")) {
    return "Notion 페이지를 읽을 수 없습니다. 해당 페이지를 KSAN Notion Integration과 공유했는지 확인해주세요.";
  }
  if (message.includes("page ID")) {
    return "올바른 Notion 페이지 링크를 입력해주세요.";
  }
  return `Notion 불러오기 실패: ${message}`;
}

function isMissingColumnError(error: { message?: string } | null, column: string) {
  const message = error?.message ?? "";
  return (
    message.includes(`'${column}' column`) ||
    message.includes(`column "${column}"`) ||
    message.includes(`.${column} does not exist`) ||
    message.includes(`${column} does not exist`)
  );
}

function accessToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

function parseRelatedIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((id) => String(id).trim()).filter(Boolean).slice(0, 3);
}

export async function GET(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  let result: {
    data: Array<Record<string, unknown>> | null;
    error: { message?: string } | null;
  } = await admin.serviceClient
    .from("guide_posts")
    .select("id,slug,title,category,summary,author,tags,notion_url,related_ids,raw_text,blocks,published,updated_at")
    .order("updated_at", { ascending: false });

  if (isMissingColumnError(result.error, "notion_url")) {
    result = await admin.serviceClient
      .from("guide_posts")
      .select("id,slug,title,category,summary,author,tags,raw_text,blocks,published,updated_at")
      .order("updated_at", { ascending: false });
  }

  if (isMissingColumnError(result.error, "related_ids")) {
    result = await admin.serviceClient
      .from("guide_posts")
      .select("id,slug,title,category,summary,author,tags,notion_url,raw_text,blocks,published,updated_at")
      .order("updated_at", { ascending: false });
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const { data: savedGuides } = await admin.serviceClient
    .from("saved_guides")
    .select("guide_slug");
  const savedCounts = new Map<string, number>();
  for (const savedGuide of (savedGuides ?? []) as Array<{ guide_slug?: string | null }>) {
    const slug = savedGuide.guide_slug ?? "";
    if (!slug) continue;
    savedCounts.set(slug, (savedCounts.get(slug) ?? 0) + 1);
  }

  const guides = (result.data ?? []).map((guide) => ({
    ...guide,
    notion_url: guide.notion_url ?? null,
    saved_count: savedCounts.get(String(guide.slug ?? "")) ?? 0
  }));

  return NextResponse.json({ guides });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  const notionUrl = String(payload.notionUrl ?? "").trim();
  if (!notionUrl) {
    return NextResponse.json({ error: "Notion 링크를 입력해주세요." }, { status: 400 });
  }

  try {
    const notionPage = await getNotionPageFromUrl(notionUrl);
    const headings = buildGuideTocHeadings(notionPage.blocks);
    return NextResponse.json({ ...notionPage, headings });
  } catch (error) {
    return NextResponse.json({ error: notionError(error) }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  let title = String(payload.title ?? "").trim();
  const rawText = String(payload.rawText ?? "").trim();
  const notionUrl = String(payload.notionUrl ?? "").trim();

  if (!rawText && !notionUrl) {
    return NextResponse.json({ error: "본문 또는 Notion 링크 중 하나를 입력해주세요." }, { status: 400 });
  }

  let blocks = parseGuideText(rawText);
  let notionSummary = "";
  let notionTags: string[] = [];
  if (notionUrl) {
    try {
      const notionPage = await getNotionPageFromUrl(notionUrl);
      blocks = notionPage.blocks;
      title ||= notionPage.title;
      notionSummary = notionPage.summary;
      notionTags = notionPage.tags;
    } catch (error) {
      return NextResponse.json({ error: notionError(error) }, { status: 400 });
    }
  }

  if (!title) {
    return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  const slug = String(payload.slug ?? "").trim() || slugFromTitle(title);
  const category = resolveGuideCategory(String(payload.category ?? "start"));
  const tags = mergeGuideTags(parseGuideTags(String(payload.tags ?? "")), notionTags, extractHashTagsFromText(rawText));

  const guidePost = {
    slug,
    title,
    category: category.id,
    summary: String(payload.summary ?? "").trim() || notionSummary || deriveSummary(rawText),
    author: String(payload.author ?? "KSAN").trim() || "KSAN",
    tags,
    related_ids: parseRelatedIds(payload.relatedIds),
    notion_url: notionUrl || null,
    raw_text: rawText,
    blocks,
    published: Boolean(payload.published),
    updated_at: new Date().toISOString()
  };

  let result = await admin.serviceClient
    .from("guide_posts")
    .upsert(guidePost, { onConflict: "slug" })
    .select("id, slug")
    .single();

  let savedWithoutNotionUrl = false;

  if (isMissingColumnError(result.error, "notion_url")) {
    savedWithoutNotionUrl = true;
    const guidePostWithoutNotionUrl = {
      slug: guidePost.slug,
      title: guidePost.title,
      category: guidePost.category,
      summary: guidePost.summary,
      author: guidePost.author,
      tags: guidePost.tags,
      related_ids: guidePost.related_ids,
      raw_text: guidePost.raw_text,
      blocks: guidePost.blocks,
      published: guidePost.published,
      updated_at: guidePost.updated_at
    };

    result = await admin.serviceClient
      .from("guide_posts")
      .upsert(guidePostWithoutNotionUrl, { onConflict: "slug" })
      .select("id, slug")
      .single();
  }

  if (isMissingColumnError(result.error, "related_ids")) {
    if (guidePost.related_ids.length) {
      return NextResponse.json({ error: "Supabase guide_posts 테이블에 related_ids 컬럼을 먼저 추가해주세요." }, { status: 500 });
    }
    const baseGuidePost: Record<string, unknown> = savedWithoutNotionUrl
      ? {
          slug: guidePost.slug,
          title: guidePost.title,
          category: guidePost.category,
          summary: guidePost.summary,
          author: guidePost.author,
          tags: guidePost.tags,
          raw_text: guidePost.raw_text,
          blocks: guidePost.blocks,
          published: guidePost.published,
          updated_at: guidePost.updated_at
        }
      : guidePost;
    const guidePostWithoutRelatedIds = { ...baseGuidePost };
    delete guidePostWithoutRelatedIds.related_ids;
    result = await admin.serviceClient
      .from("guide_posts")
      .upsert(guidePostWithoutRelatedIds, { onConflict: "slug" })
      .select("id, slug")
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ id: result.data.id, slug: result.data.slug });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  if (!payload.id) {
    return NextResponse.json({ error: "가이드 ID가 필요합니다." }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (payload.title !== undefined) patch.title = String(payload.title).trim();
  if (payload.slug !== undefined) patch.slug = String(payload.slug).trim();
  if (payload.summary !== undefined) patch.summary = String(payload.summary ?? "").trim();
  if (payload.category !== undefined) patch.category = resolveGuideCategory(String(payload.category)).id;
  if (payload.author !== undefined) patch.author = String(payload.author ?? "KSAN").trim() || "KSAN";
  if (payload.rawText !== undefined) patch.raw_text = String(payload.rawText ?? "");
  if (payload.notionUrl !== undefined) patch.notion_url = String(payload.notionUrl ?? "").trim() || null;
  if (payload.blocks !== undefined) patch.blocks = payload.blocks;
  if (typeof payload.published === "boolean") patch.published = payload.published;
  if (payload.tags !== undefined) patch.tags = parseGuideTags(String(payload.tags ?? ""));
  if (payload.relatedIds !== undefined) patch.related_ids = parseRelatedIds(payload.relatedIds);

  let result = await admin.serviceClient.from("guide_posts").update(patch as never).eq("id", payload.id);

  if (isMissingColumnError(result.error, "notion_url")) {
    delete patch.notion_url;
    result = await admin.serviceClient.from("guide_posts").update(patch as never).eq("id", payload.id);
  }

  if (isMissingColumnError(result.error, "related_ids")) {
    const requestedRelatedIds = parseRelatedIds(payload.relatedIds);
    if (requestedRelatedIds.length) {
      return NextResponse.json({ error: "Supabase guide_posts 테이블에 related_ids 컬럼을 먼저 추가해주세요." }, { status: 500 });
    }
    delete patch.related_ids;
    result = await admin.serviceClient.from("guide_posts").update(patch as never).eq("id", payload.id);
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "가이드 ID가 필요합니다." }, { status: 400 });
  }

  const { error } = await admin.serviceClient.from("guide_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
