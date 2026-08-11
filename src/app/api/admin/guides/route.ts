import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { deriveSummary, parseGuideText, slugFromTitle } from "@/lib/guideParser";

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

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
