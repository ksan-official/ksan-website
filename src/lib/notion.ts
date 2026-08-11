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

function propertyText(page: NotionPage, key: string): string {
  return textFromRichText(page.properties[key]);
}

function propertySelect(page: NotionPage, key: string): string {
  const value = page.properties[key] as { select?: { name?: string } } | undefined;
  return value?.select?.name ?? "";
}

function propertyMultiSelect(page: NotionPage, key: string): string[] {
  const value = page.properties[key] as { multi_select?: Array<{ name?: string }> } | undefined;
  return value?.multi_select?.map((item) => item.name ?? "").filter(Boolean) ?? [];
}

function propertyDate(page: NotionPage, key: string): string {
  const value = page.properties[key] as { date?: { start?: string } } | undefined;
  return value?.date?.start ?? page.last_edited_time?.slice(0, 10) ?? "";
}

function mapPage(page: NotionPage): GuideSummary {
  return {
    id: page.id,
    slug: propertyText(page, "Slug") || page.id,
    title: propertyText(page, "Title") || "Untitled",
    category: propertySelect(page, "Category") || "정착가이드",
    summary: propertyText(page, "Summary"),
    updatedAt: propertyDate(page, "Updated"),
    author: propertyText(page, "Author") || "KSAN",
    tags: propertyMultiSelect(page, "Tags")
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
    throw new Error(`Notion request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function listGuides(): Promise<GuideSummary[]> {
  const databaseId = getOptionalEnv("NOTION_GUIDES_DATABASE_ID");
  if (!databaseId || !getOptionalEnv("NOTION_API_KEY")) {
    return fallbackGuides;
  }

  const data = await notionFetch<{ results: NotionPage[] }>(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      sorts: [{ property: "Updated", direction: "descending" }]
    })
  });

  return data.results.map(mapPage);
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

  const data = await notionFetch<{ results: NotionPage[] }>(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        property: "Slug",
        rich_text: {
          equals: slug
        }
      },
      page_size: 1
    })
  });

  const page = data.results[0];
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
}
