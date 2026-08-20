import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

function accessToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((tag) => String(tag).trim()).filter(Boolean))).slice(0, 8);
}

function missingAccentColumn(error: { message?: string } | null) {
  return Boolean(error?.message?.toLowerCase().includes("accent"));
}

async function featuredSlotAvailable(
  serviceClient: SupabaseClient,
  excludedId?: string
) {
  let query = serviceClient.from("business_posts").select("id", { count: "exact", head: true }).eq("featured", true);
  if (excludedId) query = query.neq("id", excludedId);
  const { count } = await query;
  return (count ?? 0) < 3;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  const baseSelect =
    "id,title,company,location,employment_type,deadline,apply_mode,apply_target,description,department,tags,featured,featured_order,published,created_at";
  const query = admin.serviceClient
    .from("business_posts")
    .select(`${baseSelect},accent`)
    .order("featured", { ascending: false })
    .order("featured_order", { ascending: true })
    .order("created_at", { ascending: false });
  let { data, error } = await query;

  if (missingAccentColumn(error)) {
    const fallback = await admin.serviceClient
      .from("business_posts")
      .select(baseSelect)
      .order("featured", { ascending: false })
      .order("featured_order", { ascending: true })
      .order("created_at", { ascending: false });
    data = fallback.data?.map((post) => ({ ...post, accent: "orange" })) ?? null;
    error = fallback.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  const payload = await request.json();
  if (payload.featured && !(await featuredSlotAvailable(admin.serviceClient))) {
    return NextResponse.json({ error: "하이라이트 배너는 최대 3개까지 지정할 수 있습니다." }, { status: 400 });
  }

  const row = {
      apply_mode: payload.applyMode,
      apply_target: payload.applyTarget,
      company: payload.company,
      deadline: payload.deadline || null,
      department: payload.department || null,
      description: payload.description,
      employment_type: payload.employmentType,
      featured: Boolean(payload.featured),
      featured_order: Number(payload.featuredOrder) || 0,
      location: payload.location,
      published: Boolean(payload.published),
      tags: cleanTags(payload.tags),
      title: payload.title
    };
  let { data, error } = await admin.serviceClient
    .from("business_posts")
    .insert({ ...row, accent: payload.accent ?? "orange" } as never)
    .select("id")
    .single();

  if (missingAccentColumn(error)) {
    const fallback = await admin.serviceClient
      .from("business_posts")
      .insert(row as never)
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "공고 저장 결과를 확인하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  const payload = await request.json();
  if (!payload.id) return NextResponse.json({ error: "공고 ID가 필요합니다." }, { status: 400 });
  if (payload.featured === true && !(await featuredSlotAvailable(admin.serviceClient, payload.id))) {
    return NextResponse.json({ error: "하이라이트 배너는 최대 3개까지 지정할 수 있습니다." }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const editableFields: Array<[string, string]> = [
    ["accent", "accent"], ["applyMode", "apply_mode"], ["applyTarget", "apply_target"],
    ["company", "company"], ["deadline", "deadline"], ["department", "department"],
    ["description", "description"], ["employmentType", "employment_type"],
    ["location", "location"], ["title", "title"]
  ];
  editableFields.forEach(([inputKey, column]) => {
    if (payload[inputKey] !== undefined) patch[column] = inputKey === "deadline" ? payload[inputKey] || null : payload[inputKey];
  });
  if (typeof payload.published === "boolean") patch.published = payload.published;
  if (typeof payload.featured === "boolean") patch.featured = payload.featured;
  if (payload.featuredOrder !== undefined) patch.featured_order = Number(payload.featuredOrder) || 0;
  if (payload.tags !== undefined) patch.tags = cleanTags(payload.tags);

  let { error } = await admin.serviceClient.from("business_posts").update(patch as never).eq("id", payload.id);
  if (missingAccentColumn(error) && "accent" in patch) {
    delete patch.accent;
    const fallback = await admin.serviceClient.from("business_posts").update(patch as never).eq("id", payload.id);
    error = fallback.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "공고 ID가 필요합니다." }, { status: 400 });

  const { error } = await admin.serviceClient.from("business_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
