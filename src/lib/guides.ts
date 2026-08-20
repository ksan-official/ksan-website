import { getGuideBySlug as getNotionGuideBySlug, listGuides as listNotionGuides } from "@/lib/notion";
import { normalizeSlug, slugFromTitle } from "@/lib/guideParser";
import { createServiceSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import type { GuideBlock, GuideDetail, GuideSummary } from "@/lib/types";

type GuidePostRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  author: string | null;
  tags: string[] | null;
  blocks: GuideBlock[] | null;
  published: boolean;
  updated_at: string;
};

function hasNotionConfig() {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_GUIDES_DATABASE_ID);
}

function mapGuideRow(row: GuidePostRow): GuideSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary ?? "",
    updatedAt: row.updated_at.slice(0, 10),
    author: row.author ?? "KSAN",
    tags: row.tags ?? []
  };
}

function rowMatchesSlug(row: GuidePostRow, slug: string) {
  const normalizedSlug = normalizeSlug(decodeURIComponent(slug));
  const storedSlug = normalizeSlug(row.slug);
  const titleSlug = slugFromTitle(row.title);

  return (
    storedSlug === normalizedSlug ||
    titleSlug === normalizedSlug ||
    titleSlug.startsWith(`${normalizedSlug}-`) ||
    normalizedSlug.startsWith(`${titleSlug}-`)
  );
}

function mapGuideDetail(row: GuidePostRow, related: GuideSummary[]): GuideDetail {
  return {
    ...mapGuideRow(row),
    blocks: (row.blocks ?? []) as GuideBlock[],
    related
  };
}

async function listSupabaseGuides() {
  if (!hasSupabaseConfig()) {
    return [];
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("guide_posts")
      .select("id, slug, title, category, summary, author, tags, blocks, published, updated_at")
      .eq("published", true)
      .order("updated_at", { ascending: false });

    if (error) {
      return [];
    }

    return (data ?? []).map((row) => mapGuideRow(row as GuidePostRow));
  } catch {
    return [];
  }
}

async function getSupabaseGuideBySlug(slug: string): Promise<GuideDetail | null> {
  if (!hasSupabaseConfig()) {
    return null;
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("guide_posts")
      .select("id, slug, title, category, summary, author, tags, blocks, published, updated_at")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    const guides = await listSupabaseGuides();
    if (error) {
      return null;
    }

    if (data) {
      const row = data as GuidePostRow;
      return mapGuideDetail(row, guides.filter((guide) => guide.slug !== row.slug).slice(0, 3));
    }

    const { data: rows, error: fallbackError } = await supabase
      .from("guide_posts")
      .select("id, slug, title, category, summary, author, tags, blocks, published, updated_at")
      .eq("published", true);

    if (fallbackError) {
      return null;
    }

    const row = ((rows ?? []) as GuidePostRow[]).find((item) => rowMatchesSlug(item, slug));
    return row ? mapGuideDetail(row, guides.filter((guide) => guide.slug !== row.slug).slice(0, 3)) : null;
  } catch {
    return null;
  }
}

export async function listGuides(): Promise<GuideSummary[]> {
  const supabaseGuides = await listSupabaseGuides();
  if (supabaseGuides.length > 0) {
    return supabaseGuides;
  }

  if (hasNotionConfig()) {
    return listNotionGuides();
  }

  return [];
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  const supabaseGuide = await getSupabaseGuideBySlug(slug);
  if (supabaseGuide) {
    return supabaseGuide;
  }

  if (hasNotionConfig()) {
    return getNotionGuideBySlug(slug);
  }

  return null;
}
