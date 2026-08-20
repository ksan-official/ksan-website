import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getOptionalEnv } from "@/lib/env";
import { deriveSummary, slugFromTitle } from "@/lib/guideParser";
import { blocksToHtml } from "@/lib/notionHtml";

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
  has_children?: boolean;
} & Record<string, unknown>;

type NotionFileValue = {
  caption?: NotionRichText[];
  external?: { url?: string };
  file?: { url?: string };
  name?: string;
  type?: "external" | "file" | "file_upload";
};

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
    throw new Error("환경변수 NOTION_API_KEY가 필요합니다. 로컬은 .env.local, 배포는 Vercel Environment Variables에 넣어주세요.");
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
    if (body.includes("is a database, not a page")) {
      throw new Error("데이터베이스 전체 링크가 아니라, 표에서 가이드 제목을 클릭해 들어간 개별 Notion 페이지 링크를 넣어주세요.");
    }
    throw new Error(`Notion에서 페이지를 불러오지 못했습니다. ${response.status} ${body.slice(0, 220)}`);
  }

  return (await response.json()) as T;
}

function blockText(block: NotionBlock) {
  return textFromRichText(block[block.type]);
}

function fileUrl(value: NotionFileValue | undefined) {
  return value?.external?.url ?? value?.file?.url ?? "";
}

function tableRowCells(block: NotionBlock) {
  const value = block.table_row as { cells?: NotionRichText[][] } | undefined;
  return value?.cells?.map((cell) => cell.map((item) => item.plain_text ?? "").join("").trim()) ?? [];
}

async function tableToMarkdown(block: NotionBlock) {
  const table = block.table as { has_column_header?: boolean } | undefined;
  const rows = (await listBlockChildren(block.id)).filter((child) => child.type === "table_row").map(tableRowCells);
  if (!rows.length) return null;

  const widths = rows.reduce<number[]>((current, row) => row.map((cell, index) => Math.max(current[index] ?? 3, cell.length, 3)), []);
  const formatRow = (row: string[]) => `| ${widths.map((width, index) => (row[index] ?? "").padEnd(width)).join(" | ")} |`;
  const separator = `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`;
  const [first, ...rest] = rows;
  return table?.has_column_header ? [formatRow(first), separator, ...rest.map(formatRow)].join("\n") : rows.map(formatRow).join("\n");
}

async function blockToMarkdown(block: NotionBlock, index: number) {
  const text = blockText(block);

  if (block.type === "heading_1") return `# ${text}`;
  if (block.type === "heading_2") return `## ${text}`;
  if (block.type === "heading_3") return `### ${text}`;
  if (block.type === "bulleted_list_item") return `- ${text}`;
  if (block.type === "numbered_list_item") return `${index + 1}. ${text}`;
  if (block.type === "quote" || block.type === "callout") return `> ${text}`;
  if (block.type === "to_do") return `- [ ] ${text}`;
  if (block.type === "divider") return "---";
  if (block.type === "paragraph") return text;
  if (block.type === "image") {
    const image = block.image as NotionFileValue | undefined;
    const url = fileUrl(image);
    return url ? `![${textFromRichText({ rich_text: image?.caption ?? [] }) || "이미지"}](${url})` : null;
  }
  if (block.type === "file" || block.type === "pdf") {
    const file = block[block.type] as NotionFileValue | undefined;
    const url = fileUrl(file);
    const name = file?.name || textFromRichText({ rich_text: file?.caption ?? [] }) || "첨부 파일";
    return url ? `[파일: ${name}](${url})` : null;
  }
  if (block.type === "table") return tableToMarkdown(block);
  if (!text) return null;
  return text;
}

async function listBlockChildren(blockId: string) {
  const results: NotionBlock[] = [];
  let cursor: string | null = null;

  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);
    const data = await notionFetch<{ results: NotionBlock[]; has_more?: boolean; next_cursor?: string | null }>(
      `/blocks/${blockId}/children?${query.toString()}`
    );
    results.push(...data.results);
    cursor = data.has_more ? data.next_cursor ?? null : null;
  } while (cursor);

  return results;
}

async function blocksToMarkdown(blocks: NotionBlock[], depth = 0): Promise<string[]> {
  const lines: string[] = [];

  for (const [index, block] of blocks.entries()) {
    const line = await blockToMarkdown(block, index);
    if (line) {
      lines.push(depth > 0 && /^[-\d>]/.test(line) ? `${"  ".repeat(depth)}${line}` : line);
    }

    if (block.has_children && block.type !== "table") {
      const children = await listBlockChildren(block.id);
      lines.push(...(await blocksToMarkdown(children, depth + 1)));
    }
  }

  return lines;
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
    const blocks = await listBlockChildren(pageId);
    const title = propertyText(page, ["Title", "Name", "이름", "제목", "주제"]) || "Untitled";
    const rawText = (await blocksToMarkdown(blocks)).join("\n\n");
    const html = await blocksToHtml(blocks, listBlockChildren);

    return NextResponse.json({
      title,
      slug: propertyText(page, ["Slug", "URL", "주소", "고유주소"]) || slugFromTitle(title),
      category: propertySelect(page, ["Category", "카테고리", "분류"]) || "정착가이드",
      summary: propertyText(page, ["Summary", "요약", "설명", "소개"]) || deriveSummary(rawText),
      author: propertyText(page, ["Author", "작성자", "담당자"]) || "KSAN",
      tags: propertyMultiSelect(page, ["Tags", "태그", "키워드"]),
      blocks: html.trim() ? [{ id: `${page.id}-notion-html`, type: "html", html }] : undefined,
      rawText
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Notion 페이지를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
