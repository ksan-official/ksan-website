import { getNotionBlocksFromUrl } from "@/lib/notion";
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
  related_ids?: string[] | null;
  blocks: GuideBlock[] | null;
  published: boolean;
  updated_at: string;
  notion_url?: string | null;
};

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
    tags: row.tags ?? [],
    relatedIds: row.related_ids ?? []
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
      console.error("Failed to load published guides", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapGuideRow(row as GuidePostRow));
  } catch {
    console.error("Failed to load published guides");
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
      if (error) console.error("Failed to load guide by slug", error.message);
      return null;
    }

    const summary = mapGuideRow(data as GuidePostRow);
    const relatedIds = ((data as GuidePostRow).related_ids ?? []).slice(0, 3);
    const guides = await listSupabaseGuides();
    const related = relatedIds
      .map((id) => guides.find((guide) => guide.id === id))
      .filter((guide) => guide?.slug !== slug)
      .filter((guide): guide is GuideSummary => Boolean(guide));

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
    console.error("Failed to load guide by slug");
    return null;
  }
}

export async function listGuides(): Promise<GuideSummary[]> {
  return listSupabaseGuides();
}

export async function getGuideBySlug(slug: string): Promise<GuideDetail | null> {
  return getSupabaseGuideBySlug(slug);
}
