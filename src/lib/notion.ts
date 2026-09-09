import { fallbackGuideDetail, fallbackGuides } from "@/lib/content";
import { getOptionalEnv } from "@/lib/env";
import type { GuideBlock, GuideDetail, GuideRichText, GuideSummary } from "@/lib/types";
import { deriveSummary } from "@/lib/guideParser";
import { resolveGuideCategory } from "@/lib/guide-structure";
import { extractHashTagsFromBlocks, mergeGuideTags } from "@/lib/guideTags";

const NOTION_VERSION = "2022-06-28";

type NotionRichText = {
  plain_text?: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
  text?: { content?: string; link?: { url?: string } | null };
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

function richTextFromValue(value: unknown): GuideRichText[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  const richText = value as { rich_text?: NotionRichText[]; title?: NotionRichText[] };
  const list = Array.isArray(value) ? (value as NotionRichText[]) : richText.title ?? richText.rich_text ?? [];
  return list
    .map((item) => ({
      text: item.plain_text ?? item.text?.content ?? "",
      href: item.href ?? item.text?.link?.url ?? null,
      bold: item.annotations?.bold,
      italic: item.annotations?.italic,
      strikethrough: item.annotations?.strikethrough,
      underline: item.annotations?.underline,
      code: item.annotations?.code,
      color: item.annotations?.color
    }))
    .filter((item) => item.text.length > 0);
}

function textFromRichText(value: unknown): string {
  return richTextFromValue(value).map((item) => item.text).join("").trim();
}

function propertyText(page: NotionPage, key: string): string {
  return textFromRichText(page.properties[key]);
}

function firstProperty(page: NotionPage, keys: string[]) {
  return keys.map((key) => page.properties[key]).find(Boolean);
}

function propertyTextFromKeys(page: NotionPage, keys: string[]): string {
  return textFromRichText(firstProperty(page, keys));
}

function propertySelect(page: NotionPage, key: string): string {
  const value = page.properties[key] as { select?: { name?: string } } | undefined;
  return value?.select?.name ?? "";
}

function propertySelectFromKeys(page: NotionPage, keys: string[]): string {
  const value = firstProperty(page, keys) as { select?: { name?: string } } | undefined;
  return value?.select?.name ?? "";
}

function propertyMultiSelect(page: NotionPage, key: string): string[] {
  const value = page.properties[key] as { multi_select?: Array<{ name?: string }> } | undefined;
  return value?.multi_select?.map((item) => item.name ?? "").filter(Boolean) ?? [];
}

function propertyMultiSelectFromKeys(page: NotionPage, keys: string[]): string[] {
  const value = firstProperty(page, keys) as { multi_select?: Array<{ name?: string }> } | undefined;
  return value?.multi_select?.map((item) => item.name ?? "").filter(Boolean) ?? [];
}

function propertyDate(page: NotionPage, key: string): string {
  const value = page.properties[key] as { date?: { start?: string } } | undefined;
  return value?.date?.start ?? page.last_edited_time?.slice(0, 10) ?? "";
}

function mapPage(page: NotionPage): GuideSummary {
  const category = resolveGuideCategory(propertySelectFromKeys(page, ["Category", "카테고리", "분류"]));
  return {
    id: page.id,
    slug: propertyTextFromKeys(page, ["Slug", "URL", "주소", "고유주소"]) || page.id,
    title: propertyTextFromKeys(page, ["Title", "Name", "제목", "이름", "주제"]) || "Untitled",
    category: category.title,
    categoryId: category.id,
    summary: propertyTextFromKeys(page, ["Summary", "요약", "설명", "소개"]),
    updatedAt: propertyDate(page, "Updated"),
    author: propertyTextFromKeys(page, ["Author", "작성자", "담당자"]) || "KSAN",
    tags: mergeGuideTags(propertyMultiSelectFromKeys(page, ["Tags", "태그", "해시태그", "키워드"]))
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
    if (body.includes("is a database, not a page")) {
      throw new Error("데이터베이스 전체 링크가 아니라, 표에서 가이드 제목을 클릭해 들어간 개별 Notion 페이지 링크를 넣어주세요.");
    }
    if (body.includes("Could not find database") || body.includes("Could not find block")) {
      throw new Error("Notion Integration이 이 페이지/데이터베이스에 공유되어 있는지 확인해주세요.");
    }
    throw new Error(`Notion request failed: ${response.status} ${body.slice(0, 240)}`);
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

function notionFileUrl(value: Record<string, unknown> | undefined) {
  const external = value?.external as { url?: string } | undefined;
  const file = value?.file as { url?: string } | undefined;
  return external?.url ?? file?.url;
}

function notionIcon(value: unknown) {
  const icon = value as { type?: string; emoji?: string } | undefined;
  return icon?.type === "emoji" ? icon.emoji : undefined;
}

function mapBlock(block: NotionBlock): GuideBlock | null {
  const blockValue = block[block.type] as Record<string, unknown> | undefined;
  const richText = richTextFromValue(blockValue);
  const text = richText.map((item) => item.text).join("").trim();
  const supported = [
    "heading_1",
    "heading_2",
    "heading_3",
    "paragraph",
    "bulleted_list_item",
    "numbered_list_item",
    "quote",
    "callout",
    "toggle",
    "to_do",
    "code"
  ];

  if (supported.includes(block.type) && text) {
    const caption = richTextFromValue(blockValue?.caption);
    return {
      id: block.id,
      type: block.type as GuideBlock["type"],
      text,
      richText,
      checked: block.type === "to_do" ? Boolean(blockValue?.checked) : undefined,
      icon: block.type === "callout" ? notionIcon(blockValue?.icon) : undefined,
      color: typeof blockValue?.color === "string" ? blockValue.color : undefined,
      caption: caption.length ? caption : undefined,
      language: block.type === "code" && typeof blockValue?.language === "string" ? blockValue.language : undefined
    };
  }

  if (block.type === "divider") {
    return { id: block.id, type: "divider", text: "" };
  }

  if (block.type === "table") {
    return {
      id: block.id,
      type: "table",
      text: "",
      rows: [],
      tableRows: [],
      hasColumnHeader: Boolean(blockValue?.has_column_header),
      hasRowHeader: Boolean(blockValue?.has_row_header)
    };
  }

  if (block.type === "table_row") {
    const cells = Array.isArray(blockValue?.cells) ? (blockValue.cells as unknown[]) : [];
    const tableRows = [cells.map((cell) => richTextFromValue(cell))];
    return {
      id: block.id,
      type: "table",
      text: tableRows[0].map((cell) => cell.map((segment) => segment.text).join("")).join(" ").trim(),
      rows: tableRows.map((row) => row.map((cell) => cell.map((segment) => segment.text).join("").trim())),
      tableRows
    };
  }

  if (block.type === "image") {
    const url = notionFileUrl(blockValue);
    if (!url) return null;
    const caption = richTextFromValue(blockValue?.caption);
    return { id: block.id, type: "image", text: textFromRichText(blockValue?.caption), url, caption };
  }

  if (block.type === "bookmark" || block.type === "link_preview") {
    const url = typeof blockValue?.url === "string" ? blockValue.url : undefined;
    if (!url) return null;
    const caption = richTextFromValue(blockValue?.caption);
    return { id: block.id, type: "bookmark", text: textFromRichText(blockValue?.caption) || url, url, caption };
  }

  if (["file", "pdf", "video", "audio", "embed"].includes(block.type)) {
    const url = block.type === "embed" && typeof blockValue?.url === "string"
      ? blockValue.url
      : notionFileUrl(blockValue);
    if (!url) return null;
    const caption = richTextFromValue(blockValue?.caption);
    return {
      id: block.id,
      type: "file",
      text: textFromRichText(blockValue?.caption) || "첨부 자료 열기",
      url,
      caption
    };
  }

  return null;
}

async function getBlocks(pageId: string): Promise<GuideBlock[]> {
  const blocks: GuideBlock[] = [];
  let cursor: string | undefined;

  do {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("start_cursor", cursor);
    const data = await notionFetch<{
      results: NotionBlock[];
      has_more?: boolean;
      next_cursor?: string | null;
    }>(`/blocks/${pageId}/children?${query.toString()}`);

    for (const block of data.results) {
      const mapped = mapBlock(block);
      const children = block.has_children ? await getBlocks(block.id) : [];
      if (mapped) {
        if (block.type === "table") {
          const rowBlocks = children.filter((child) => child.type === "table");
          const rows = rowBlocks.flatMap((row) => row.rows ?? []);
          const tableRows = rowBlocks.flatMap((row) => row.tableRows ?? []);
          blocks.push({ ...mapped, rows, tableRows });
        } else {
          blocks.push(children.length ? { ...mapped, children } : mapped);
        }
      } else if (children.length) {
        blocks.push(...children);
      }
    }

    cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

function pageIdFromNotionUrl(url: string) {
  const normalized = decodeURIComponent(url).replace(/-/g, "");
  const pageId = normalized.match(/([0-9a-f]{32})(?:\?|$)/i)?.[1];
  if (!pageId) {
    throw new Error("Notion page ID could not be found in the supplied URL.");
  }
  if (pageId === getOptionalEnv("NOTION_GUIDES_DATABASE_ID")?.replace(/-/g, "")) {
    throw new Error("데이터베이스 전체 링크가 아니라, 표에서 가이드 제목을 클릭해 들어간 개별 Notion 페이지 링크를 넣어주세요.");
  }
  return pageId;
}

function notionPageTitle(page: NotionPage) {
  for (const value of Object.values(page.properties)) {
    const property = value as { type?: string; title?: NotionRichText[] };
    if (property.type === "title" || property.title) {
      const title = textFromRichText(property);
      if (title) return title;
    }
  }
  return "제목 없는 가이드";
}

export async function getNotionPageFromUrl(url: string) {
  const pageId = pageIdFromNotionUrl(url);
  const [page, blocks] = await Promise.all([
    notionFetch<NotionPage>(`/pages/${pageId}`),
    getBlocks(pageId)
  ]);
  const title = notionPageTitle(page);
  const plainText = blocks
    .filter((block) => block.type === "paragraph")
    .map((block) => block.text)
    .join("\n\n");
  return {
    pageId,
    title,
    summary: deriveSummary(plainText),
    tags: mergeGuideTags(propertyMultiSelectFromKeys(page, ["Tags", "태그", "해시태그", "키워드"]), extractHashTagsFromBlocks(blocks)),
    blocks
  };
}

export async function getNotionBlocksFromUrl(url: string): Promise<GuideBlock[]> {
  return (await getNotionPageFromUrl(url)).blocks;
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
