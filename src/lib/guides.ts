import { fallbackGuideDetail, fallbackGuides } from "@/lib/content";
import { getGuideBySlug as getNotionGuideBySlug, listGuides as listNotionGuides } from "@/lib/notion";
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
      .single();

    if (error || !data) {
      return null;
    }

    const summary = mapGuideRow(data as GuidePostRow);
    const related = (await listSupabaseGuides()).filter((guide) => guide.slug !== slug).slice(0, 3);

    return {
      ...summary,
      blocks: ((data as GuidePostRow).blocks ?? []) as GuideBlock[],
      related
    };
  } catch {
    return null;
  }
}

export async function listGuides(): Promise<GuideSummary[]> {
  if (hasNotionConfig()) {
    return listNotionGuides();
  }

  const supabaseGuides = await listSupabaseGuides();
  return supabaseGuides.length > 0 ? supabaseGuides : fallbackGuides;
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  if (hasNotionConfig()) {
    return getNotionGuideBySlug(slug);
  }

  return (await getSupabaseGuideBySlug(slug)) ?? (slug === fallbackGuideDetail.slug ? fallbackGuideDetail : null);
}
