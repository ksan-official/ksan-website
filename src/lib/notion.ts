import { fallbackGuideDetail, fallbackGuides } from "@/lib/content";
import { getOptionalEnv } from "@/lib/env";
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
  const title = propertyText(page, ["Title", "Name", "이름", "제목"]) || "Untitled";

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
  console.warn(`[notion] ${context} failed. Falling back to local guide content. ${message}`);
}

export async function listGuides(): Promise<GuideSummary[]> {
  const databaseId = getOptionalEnv("NOTION_GUIDES_DATABASE_ID");
  if (!databaseId || !getOptionalEnv("NOTION_API_KEY")) {
    return fallbackGuides;
  }

  try {
    const data = await notionFetch<{ results: NotionPage[] }>(`/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify({})
    });

    return data.results.map(mapPage);
  } catch (error) {
    logNotionFallback("Guide database query", error);
    return fallbackGuides;
  }
}

function mapBlock(block: NotionBlock): GuideBlock | null {
  const blockValue = block[block.type] as { rich_text?: NotionRichText[] } | undefined;
  const text = textFromRichText(blockValue);
  const supported = [
    "heading_1",
    "heading_2",
    "heading_3",
    "paragraph",
    "bulleted_list_item",
    "numbered_list_item",
    "quote",
    "callout"
  ];

  if (!supported.includes(block.type) || !text) {
    return null;
  }

  return {
    id: block.id,
    type: block.type as GuideBlock["type"],
    text
  };
}

async function getBlocks(pageId: string): Promise<GuideBlock[]> {
  const data = await notionFetch<{ results: NotionBlock[] }>(`/blocks/${pageId}/children?page_size=100`);
  return data.results.map(mapBlock).filter((block): block is GuideBlock => Boolean(block));
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  const databaseId = getOptionalEnv("NOTION_GUIDES_DATABASE_ID");
  if (!databaseId || !getOptionalEnv("NOTION_API_KEY")) {
    return slug === fallbackGuideDetail.slug ? fallbackGuideDetail : null;
  }

  try {
    const data = await notionFetch<{ results: NotionPage[] }>(`/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify({})
    });

    const page = data.results.find((result) => mapPage(result).slug === slug);
    if (!page) {
      return null;
    }

    const summary = mapPage(page);
    const guides = await listGuides();
    return {
      ...summary,
      blocks: await getBlocks(page.id),
      related: guides.filter((guide) => guide.slug !== slug).slice(0, 3)
    };
  } catch (error) {
    logNotionFallback(`Guide detail query for "${slug}"`, error);
    return slug === fallbackGuideDetail.slug ? fallbackGuideDetail : null;
  }
}
