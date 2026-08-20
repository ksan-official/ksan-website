import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getOptionalEnv } from "@/lib/env";
import { deriveSummary, slugFromTitle } from "@/lib/guideParser";

const NOTION_VERSION = "2022-06-28";

type NotionRichText = {
  plain_text?: string;
};

type NotionPage = {
  id: string;
  properties: Record<string, unknown>;
};

type NotionBlock = {
  id: string;
  type: string;
} & Record<string, unknown>;

function accessToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

function notionPageIdFromUrl(value: string) {
  const match = value.replace(/-/g, "").match(/[0-9a-fA-F]{32}/);
  return match?.[0] ?? null;
}

function textFromRichText(value: unknown): string {
  const richText = value as { rich_text?: NotionRichText[]; title?: NotionRichText[] } | undefined;
  const list = richText?.title ?? richText?.rich_text ?? [];
  return list.map((item) => item.plain_text ?? "").join("").trim();
}

function firstProperty(page: NotionPage, keys: string[]) {
  return keys.map((key) => page.properties[key]).find(Boolean);
}

function propertyText(page: NotionPage, keys: string[]) {
  return textFromRichText(firstProperty(page, keys));
}

function propertySelect(page: NotionPage, keys: string[]) {
  const value = firstProperty(page, keys) as { select?: { name?: string } } | undefined;
  return value?.select?.name ?? "";
}

function propertyMultiSelect(page: NotionPage, keys: string[]) {
  const value = firstProperty(page, keys) as { multi_select?: Array<{ name?: string }> } | undefined;
  return value?.multi_select?.map((item) => item.name ?? "").filter(Boolean) ?? [];
}

async function notionFetch<T>(path: string): Promise<T> {
  const apiKey = getOptionalEnv("NOTION_API_KEY");
  if (!apiKey) {
    throw new Error("Vercel 환경변수 NOTION_API_KEY가 필요합니다.");
  }

  const response = await fetch(`https://api.notion.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion에서 페이지를 불러오지 못했습니다. ${response.status} ${body.slice(0, 220)}`);
  }

  return (await response.json()) as T;
}

function blockText(block: NotionBlock) {
  return textFromRichText(block[block.type]);
}

function blockToMarkdown(block: NotionBlock, index: number) {
  const text = blockText(block);
  if (!text && block.type !== "divider") return null;

  if (block.type === "heading_1") return `# ${text}`;
  if (block.type === "heading_2") return `## ${text}`;
  if (block.type === "heading_3") return `### ${text}`;
  if (block.type === "bulleted_list_item") return `- ${text}`;
  if (block.type === "numbered_list_item") return `${index + 1}. ${text}`;
  if (block.type === "quote" || block.type === "callout") return `> ${text}`;
  if (block.type === "to_do") return `- [ ] ${text}`;
  if (block.type === "divider") return "---";
  if (block.type === "paragraph") return text;
  return text;
}

export async function POST(request: Request) {
  const admin = await requireAdmin(accessToken(request));

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  const pageId = notionPageIdFromUrl(String(payload.url ?? ""));
  if (!pageId) {
    return NextResponse.json({ error: "올바른 Notion 페이지 링크를 넣어주세요." }, { status: 400 });
  }

  try {
    const page = await notionFetch<NotionPage>(`/pages/${pageId}`);
    const blocks = await notionFetch<{ results: NotionBlock[] }>(`/blocks/${pageId}/children?page_size=100`);
    const title = propertyText(page, ["Title", "Name", "이름", "제목", "주제"]) || "Untitled";
    const rawText = blocks.results
      .map((block, index) => blockToMarkdown(block, index))
      .filter(Boolean)
      .join("\n\n");

    return NextResponse.json({
      title,
      slug: propertyText(page, ["Slug", "URL", "주소", "고유주소"]) || slugFromTitle(title),
      category: propertySelect(page, ["Category", "카테고리", "분류"]) || "정착가이드",
      summary: propertyText(page, ["Summary", "요약", "설명", "소개"]) || deriveSummary(rawText),
      author: propertyText(page, ["Author", "작성자", "담당자"]) || "KSAN",
      tags: propertyMultiSelect(page, ["Tags", "태그", "키워드"]),
      rawText
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Notion 페이지를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
