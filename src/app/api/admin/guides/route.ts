import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { deriveSummary, parseGuideText, slugFromTitle } from "@/lib/guideParser";
import { resolveGuideCategory } from "@/lib/guide-structure";
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

export async function PUT(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

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
    const headings = notionPage.blocks
      .flatMap(function flatten(block): typeof notionPage.blocks {
        return [block, ...(block.children?.flatMap(flatten) ?? [])];
      })
      .filter((block) => block.type.startsWith("heading"))
      .map((block) => ({ id: block.id, type: block.type, text: block.text }));
    return NextResponse.json({ ...notionPage, headings });
  } catch (error) {
    return NextResponse.json({ error: notionError(error) }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

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
  if (notionUrl) {
    try {
      const notionPage = await getNotionPageFromUrl(notionUrl);
      blocks = notionPage.blocks;
      title ||= notionPage.title;
      notionSummary = notionPage.summary;
    } catch (error) {
      return NextResponse.json({ error: notionError(error) }, { status: 400 });
    }
  }

  if (!title) {
    return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
  }

  const slug = String(payload.slug ?? "").trim() || slugFromTitle(title);
  const category = resolveGuideCategory(String(payload.category ?? "start"));
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
        category: category.id,
        summary: String(payload.summary ?? "").trim() || notionSummary || deriveSummary(rawText),
        author: String(payload.author ?? "KSAN").trim() || "KSAN",
        tags,
        notion_url: notionUrl || null,
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
