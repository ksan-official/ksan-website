import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { deriveSummary, parseGuideText, slugFromTitle } from "@/lib/guideParser";

function accessToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const { data, error } = await admin.serviceClient
    .from("guide_posts")
    .select("id,slug,title,category,summary,author,tags,raw_text,published,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ guides: data ?? [] });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  const title = String(payload.title ?? "").trim();
  const rawText = String(payload.rawText ?? "").trim();

  if (!title || !rawText) {
    return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
  }

  const slug = String(payload.slug ?? "").trim() || slugFromTitle(title);
  const blocks = parseGuideText(rawText);
  const tags = String(payload.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const { data, error } = await admin.serviceClient
    .from("guide_posts")
    .upsert(
      {
        slug,
        title,
        category: String(payload.category ?? "정착가이드").trim() || "정착가이드",
        summary: String(payload.summary ?? "").trim() || deriveSummary(rawText),
        author: String(payload.author ?? "KSAN").trim() || "KSAN",
        tags,
        raw_text: rawText,
        blocks,
        published: Boolean(payload.published),
        updated_at: new Date().toISOString()
      },
      { onConflict: "slug" }
    )
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, slug: data.slug });
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
  if (payload.category !== undefined) patch.category = String(payload.category).trim() || "정착가이드";
  if (payload.summary !== undefined) patch.summary = String(payload.summary).trim();
  if (payload.author !== undefined) patch.author = String(payload.author).trim() || "KSAN";
  if (payload.tags !== undefined) {
    patch.tags = String(payload.tags)
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  if (payload.rawText !== undefined) {
    const rawText = String(payload.rawText).trim();
    patch.raw_text = rawText;
    patch.blocks = parseGuideText(rawText);
    if (!patch.summary) patch.summary = deriveSummary(rawText);
  }
  if (typeof payload.published === "boolean") patch.published = payload.published;

  const { error } = await admin.serviceClient.from("guide_posts").update(patch as never).eq("id", payload.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
