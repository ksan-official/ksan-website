import { getOptionalEnv } from "@/lib/env";
import { blocksToHtml } from "@/lib/notionHtml";
import type { GuideBlock, GuideDetail, GuideSummary } from "@/lib/types";

const NOTION_VERSION = "2022-06-28";

type NotionRichText = {
  plain_text?: string;
};

type NotionPage = {
  id: string;
  last_edited_time?: string;
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

function textFromRichText(value: unknown): string {
  const richText = value as { rich_text?: NotionRichText[]; title?: NotionRichText[] };
  const list = richText.title ?? richText.rich_text ?? [];
  return list.map((item) => item.plain_text ?? "").join("").trim();
}

function propertyValue(page: NotionPage, keys: string[]): unknown {
  return keys.map((key) => page.properties[key]).find(Boolean);
}

function propertyText(page: NotionPage, keys: string[]): string {
  return textFromRichText(propertyValue(page, keys));
}

function propertySelect(page: NotionPage, keys: string[]): string {
  const value = propertyValue(page, keys) as { select?: { name?: string } } | undefined;
  return value?.select?.name ?? "";
}

function propertyMultiSelect(page: NotionPage, keys: string[]): string[] {
  const value = propertyValue(page, keys) as { multi_select?: Array<{ name?: string }> } | undefined;
  return value?.multi_select?.map((item) => item.name ?? "").filter(Boolean) ?? [];
}

function propertyDate(page: NotionPage, keys: string[]): string {
  const value = propertyValue(page, keys) as { date?: { start?: string } } | undefined;
  return value?.date?.start ?? page.last_edited_time?.slice(0, 10) ?? "";
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "") || "guide"
  );
}

function mapPage(page: NotionPage): GuideSummary {
  const title = propertyText(page, ["Title", "Name", "이름", "제목", "주제"]) || "Untitled";

  return {
    id: page.id,
    slug: propertyText(page, ["Slug", "URL", "주소", "고유주소"]) || slugify(title) || page.id,
    title,
    category: propertySelect(page, ["Category", "카테고리", "분류"]) || "정착가이드",
    summary: propertyText(page, ["Summary", "요약", "설명", "소개"]),
    updatedAt: propertyDate(page, ["Updated", "수정일", "업데이트", "날짜"]),
    author: propertyText(page, ["Author", "작성자", "담당자"]) || "KSAN",
    tags: propertyMultiSelect(page, ["Tags", "태그", "키워드"])
  };
}

function pageMatchesSlug(page: NotionPage, slug: string) {
  const normalizedSlug = slugify(decodeURIComponent(slug));
  const summary = mapPage(page);
  const pageSlug = slugify(summary.slug);
  const titleSlug = slugify(summary.title);

  return (
    pageSlug === normalizedSlug ||
    titleSlug === normalizedSlug ||
    titleSlug.startsWith(`${normalizedSlug}-`) ||
    normalizedSlug.startsWith(`${titleSlug}-`)
  );
}

async function notionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getOptionalEnv("NOTION_API_KEY");
  if (!apiKey) {
    throw new Error("Notion API key is not configured.");
  }

  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
      ...init?.headers
    },
    next: { revalidate: 300 }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion request failed: ${response.status} ${body.slice(0, 300)}`);
  }

  return (await response.json()) as T;
}

function logNotionFallback(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[notion] ${context} failed. ${message}`);
}

export async function listGuides(): Promise<GuideSummary[]> {
  const databaseId = getOptionalEnv("NOTION_GUIDES_DATABASE_ID");
  if (!databaseId || !getOptionalEnv("NOTION_API_KEY")) {
    return [];
  }

  try {
    const data = await notionFetch<{ results: NotionPage[] }>(`/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify({})
    });

    return data.results.map(mapPage);
  } catch (error) {
    logNotionFallback("Guide database query", error);
    return [];
  }
}

function mapBlock(block: NotionBlock): GuideBlock | null {
  const blockValue = block[block.type] as { rich_text?: NotionRichText[] } | undefined;
  const text = textFromRichText(blockValue);
  if (block.type === "image") {
    const image = block.image as NotionFileValue | undefined;
    const url = image?.external?.url ?? image?.file?.url ?? "";
    return url ? { id: block.id, type: "image", caption: textFromRichText({ rich_text: image?.caption ?? [] }), url } : null;
  }

  if (block.type === "file" || block.type === "pdf") {
    const file = block[block.type] as NotionFileValue | undefined;
    const url = file?.external?.url ?? file?.file?.url ?? "";
    const name = file?.name || textFromRichText({ rich_text: file?.caption ?? [] }) || "첨부 파일";
    return url ? { id: block.id, type: "file", caption: textFromRichText({ rich_text: file?.caption ?? [] }), name, url } : null;
  }

  const supported = [
    "heading_1",
    "heading_2",
    "heading_3",
    "paragraph",
    "bulleted_list_item",
    "numbered_list_item",
    "quote",
    "callout"
  ] as const;

  if (!supported.includes(block.type as (typeof supported)[number]) || !text) {
    return null;
  }

  return {
    id: block.id,
    type: block.type as (typeof supported)[number],
    text
  };
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

function tableRowCells(block: NotionBlock) {
  const value = block.table_row as { cells?: NotionRichText[][] } | undefined;
  return value?.cells?.map((cell) => cell.map((item) => item.plain_text ?? "").join("").trim()) ?? [];
}

async function getBlocks(pageId: string, depth = 0): Promise<GuideBlock[]> {
  const blocks = await listBlockChildren(pageId);
  const results: GuideBlock[] = [];

  for (const block of blocks) {
    if (block.type === "table") {
      const table = block.table as { has_column_header?: boolean; has_row_header?: boolean } | undefined;
      const rows = (await listBlockChildren(block.id)).filter((child) => child.type === "table_row").map(tableRowCells);
      if (rows.length) {
        results.push({
          id: block.id,
          type: "table",
          hasColumnHeader: table?.has_column_header,
          hasRowHeader: table?.has_row_header,
          rows
        });
      }
      continue;
    }

    const mapped = mapBlock(block);
    if (mapped) {
      results.push(depth > 0 && (mapped.type === "bulleted_list_item" || mapped.type === "numbered_list_item") ? { ...mapped, text: `  ${mapped.text}` } : mapped);
    }
    if (block.has_children) {
      results.push(...(await getBlocks(block.id, depth + 1)));
    }
  }

  return results;
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  const databaseId = getOptionalEnv("NOTION_GUIDES_DATABASE_ID");
  if (!databaseId || !getOptionalEnv("NOTION_API_KEY")) {
    return null;
  }

  try {
    const data = await notionFetch<{ results: NotionPage[] }>(`/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify({})
    });

    const page = data.results.find((result) => pageMatchesSlug(result, slug));
    if (!page) {
      return null;
    }

    const summary = mapPage(page);
    const guides = await listGuides();
    const blocks = await listBlockChildren(page.id);
    const html = await blocksToHtml(blocks, listBlockChildren);
    return {
      ...summary,
      blocks: html.trim() ? [{ id: `${page.id}-notion-html`, type: "html", html }] : await getBlocks(page.id),
      related: guides.filter((guide) => guide.slug !== slug).slice(0, 3)
    };
  } catch (error) {
    logNotionFallback(`Guide detail query for "${slug}"`, error);
    return null;
  }
}
