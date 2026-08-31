import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import { composeBusinessDetailText, resolveBusinessDetails } from "@/lib/business";

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

function missingDetailColumns(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return ["company_intro", "responsibilities", "requirements"].some((column) => message.includes(column));
}

function withoutNewerColumns<T extends Record<string, unknown>>(value: T, options: { accent?: boolean; details?: boolean }) {
  const copy = { ...value };
  if (options.accent) delete copy.accent;
  if (options.details) {
    delete copy.company_intro;
    delete copy.requirements;
    delete copy.responsibilities;
  }
  return copy;
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
  const detailSelect = `${baseSelect},company_intro,responsibilities,requirements`;
  const query = admin.serviceClient
    .from("business_posts")
    .select(`${detailSelect},accent`)
    .order("featured", { ascending: false })
    .order("featured_order", { ascending: true })
    .order("created_at", { ascending: false });
  let { data, error } = await query;

  if (missingAccentColumn(error) || missingDetailColumns(error)) {
    const fallback = await admin.serviceClient
      .from("business_posts")
      .select(baseSelect)
      .order("featured", { ascending: false })
      .order("featured_order", { ascending: true })
      .order("created_at", { ascending: false });
    data = fallback.data?.map((post) => {
      const details = resolveBusinessDetails({
        description: post.description,
        companyIntro: null,
        requirements: null,
        responsibilities: null
      });
      return {
        ...post,
        accent: "orange",
        company_intro: details.companyIntro,
        requirements: details.requirements,
        responsibilities: details.responsibilities
      };
    }) ?? null;
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
      company_intro: payload.companyIntro || null,
      deadline: payload.deadline || null,
      department: payload.department || null,
      description: payload.description,
      employment_type: payload.employmentType,
      featured: Boolean(payload.featured),
      featured_order: Number(payload.featuredOrder) || 0,
      location: payload.location,
      published: Boolean(payload.published),
      requirements: payload.requirements || null,
      responsibilities: payload.responsibilities || null,
      tags: cleanTags(payload.tags),
      title: payload.title
    };
  let insertRow = { ...row, accent: payload.accent ?? "orange" };
  let { data, error } = await admin.serviceClient.from("business_posts").insert(insertRow as never).select("id").single();

  if (missingAccentColumn(error) || missingDetailColumns(error)) {
    insertRow = withoutNewerColumns(insertRow, {
      accent: missingAccentColumn(error),
      details: missingDetailColumns(error)
    });
    if (missingDetailColumns(error)) {
      insertRow.description = composeBusinessDetailText({
        companyIntro: payload.companyIntro,
        description: payload.description,
        requirements: payload.requirements,
        responsibilities: payload.responsibilities
      });
    }
    const fallback = await admin.serviceClient.from("business_posts").insert(insertRow as never).select("id").single();
    data = fallback.data;
    error = fallback.error;
  }

  if (missingAccentColumn(error) || missingDetailColumns(error)) {
    insertRow = withoutNewerColumns(insertRow, {
      accent: missingAccentColumn(error),
      details: missingDetailColumns(error)
    });
    if (missingDetailColumns(error)) {
      insertRow.description = composeBusinessDetailText({
        companyIntro: payload.companyIntro,
        description: payload.description,
        requirements: payload.requirements,
        responsibilities: payload.responsibilities
      });
    }
    const fallback = await admin.serviceClient.from("business_posts").insert(insertRow as never).select("id").single();
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
    ["company", "company"], ["companyIntro", "company_intro"], ["deadline", "deadline"], ["department", "department"],
    ["description", "description"], ["employmentType", "employment_type"],
    ["location", "location"], ["requirements", "requirements"], ["responsibilities", "responsibilities"], ["title", "title"]
  ];
  editableFields.forEach(([inputKey, column]) => {
    if (payload[inputKey] !== undefined) patch[column] = inputKey === "deadline" ? payload[inputKey] || null : payload[inputKey];
  });
  if (typeof payload.published === "boolean") patch.published = payload.published;
  if (typeof payload.featured === "boolean") patch.featured = payload.featured;
  if (payload.featuredOrder !== undefined) patch.featured_order = Number(payload.featuredOrder) || 0;
  if (payload.tags !== undefined) patch.tags = cleanTags(payload.tags);

  let { error } = await admin.serviceClient.from("business_posts").update(patch as never).eq("id", payload.id);
  if (missingAccentColumn(error) || missingDetailColumns(error)) {
    Object.assign(patch, withoutNewerColumns(patch, {
      accent: missingAccentColumn(error),
      details: missingDetailColumns(error)
    }));
    if (missingAccentColumn(error)) delete patch.accent;
    if (missingDetailColumns(error)) {
      patch.description = composeBusinessDetailText({
        companyIntro: payload.companyIntro,
        description: String(payload.description ?? ""),
        requirements: payload.requirements,
        responsibilities: payload.responsibilities
      });
      delete patch.company_intro;
      delete patch.requirements;
      delete patch.responsibilities;
    }
    const fallback = await admin.serviceClient.from("business_posts").update(patch as never).eq("id", payload.id);
    error = fallback.error;
  }
  if (missingAccentColumn(error) || missingDetailColumns(error)) {
    if (missingAccentColumn(error)) delete patch.accent;
    if (missingDetailColumns(error)) {
      patch.description = composeBusinessDetailText({
        companyIntro: payload.companyIntro,
        description: String(payload.description ?? ""),
        requirements: payload.requirements,
        responsibilities: payload.responsibilities
      });
      delete patch.company_intro;
      delete patch.requirements;
      delete patch.responsibilities;
    }
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
