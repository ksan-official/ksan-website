import { fallbackGuideDetail, fallbackGuides } from "@/lib/content";
import {
  getGuideBySlug as getNotionGuideBySlug,
  getNotionBlocksFromUrl,
  listGuides as listNotionGuides
} from "@/lib/notion";
import { createServiceSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import { resolveGuideCategory } from "@/lib/guide-structure";
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
  notion_url?: string | null;
};

function hasNotionConfig() {
  return Boolean(process.env.NOTION_API_KEY && process.env.NOTION_GUIDES_DATABASE_ID);
}

function mapGuideRow(row: GuidePostRow): GuideSummary {
  const category = resolveGuideCategory(row.category);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: category.title,
    categoryId: category.id,
    summary: row.summary ?? "",
    updatedAt: row.updated_at.slice(0, 10),
    author: row.author ?? "KSAN",
    tags: row.tags ?? []
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
      .select("*")
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
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !data) {
      return null;
    }

    const summary = mapGuideRow(data as GuidePostRow);
    const related = (await listSupabaseGuides()).filter((guide) => guide.slug !== slug).slice(0, 3);

    let blocks = ((data as GuidePostRow).blocks ?? []) as GuideBlock[];
    const notionUrl = (data as GuidePostRow).notion_url;
    if (notionUrl && process.env.NOTION_API_KEY) {
      try {
        blocks = await getNotionBlocksFromUrl(notionUrl);
      } catch {
        // Keep the stored blocks as a safe fallback if the page is not shared with the integration.
      }
    }

    return {
      ...summary,
      blocks,
      related
    };
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
    try {
      return await listNotionGuides();
    } catch {
      return fallbackGuides;
    }
  }
  return fallbackGuides;
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  const supabaseGuide = await getSupabaseGuideBySlug(slug);
  if (supabaseGuide) {
    return supabaseGuide;
  }
  if (hasNotionConfig()) {
    try {
      return await getNotionGuideBySlug(slug);
    } catch {
      return slug === fallbackGuideDetail.slug ? fallbackGuideDetail : null;
    }
  }
  return slug === fallbackGuideDetail.slug ? fallbackGuideDetail : null;
}
