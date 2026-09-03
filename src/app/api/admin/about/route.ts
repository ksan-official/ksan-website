import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

const aboutImageBucket = "about-images";

function clean(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function boolValue(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function numberValue(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function ensureAboutImageBucket(serviceClient: SupabaseClient) {
  const { error: getError } = await serviceClient.storage.getBucket(aboutImageBucket);

  if (!getError) return null;

  const { error: createError } = await serviceClient.storage.createBucket(aboutImageBucket, {
    public: true
  });

  return createError;
}

async function uploadAboutImage(
  serviceClient: SupabaseClient,
  photo: FormDataEntryValue | null,
  entryType: string
) {
  if (!(photo instanceof File) || photo.size === 0) return null;

  if (!photo.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있어요.");
  }

  const bucketError = await ensureAboutImageBucket(serviceClient);
  if (bucketError) {
    throw new Error("소개 이미지 저장소를 준비하지 못했어요.");
  }

  const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeEntryType = entryType.replace(/[^a-z0-9_-]/gi, "-").toLowerCase() || "about";
  const path = `${safeEntryType}/${Date.now()}.${extension}`;
  const { error: uploadError } = await serviceClient.storage
    .from(aboutImageBucket)
    .upload(path, photo, {
      cacheControl: "3600",
      contentType: photo.type,
      upsert: false
    });

  if (uploadError) {
    throw new Error("소개 이미지 업로드에 실패했어요.");
  }

  const { data } = serviceClient.storage.from(aboutImageBucket).getPublicUrl(path);
  return data.publicUrl;
}

async function requestPayload(request: Request, serviceClient: SupabaseClient) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return request.json();
  }

  const formData = await request.formData();
  const entryType = clean(formData.get("entryType")) ?? "team_member";
  const uploadedImageUrl = await uploadAboutImage(serviceClient, formData.get("photo"), entryType);

  return {
    benefits: clean(formData.get("benefits")),
    body: clean(formData.get("body")),
    ctaUrl: clean(formData.get("ctaUrl")),
    entryType,
    id: clean(formData.get("id")),
    imageUrl: uploadedImageUrl ?? clean(formData.get("imageUrl")),
    published: boolValue(formData.get("published")),
    sortOrder: clean(formData.get("sortOrder")),
    sponsorKind: clean(formData.get("sponsorKind")),
    subtitle: clean(formData.get("subtitle")),
    title: clean(formData.get("title")),
    usageGuide: clean(formData.get("usageGuide"))
  };
}

function aboutPayload(payload: Record<string, unknown>) {
  return {
    benefits: clean(payload.benefits),
    body: clean(payload.body),
    cta_url: clean(payload.ctaUrl),
    entry_type: clean(payload.entryType) ?? "team_member",
    image_url: clean(payload.imageUrl),
    published: boolValue(payload.published),
    sort_order: numberValue(payload.sortOrder),
    sponsor_kind: clean(payload.sponsorKind) ?? "sponsor",
    subtitle: clean(payload.subtitle),
    title: clean(payload.title) ?? "",
    usage_guide: clean(payload.usageGuide)
  };
}

export async function GET(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const { data, error } = await admin.serviceClient
    .from("about_entries")
    .select("id,entry_type,title,subtitle,body,image_url,sponsor_kind,benefits,usage_guide,cta_url,sort_order,published,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  try {
    const payload = await requestPayload(request, admin.serviceClient);
    const entry = aboutPayload(payload);

    if (!entry.title) {
      return NextResponse.json({ error: "이름 또는 제목을 입력해 주세요." }, { status: 400 });
    }

    const { data, error } = await admin.serviceClient
      .from("about_entries")
      .insert(entry)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "저장에 실패했어요." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  try {
    const payload = await requestPayload(request, admin.serviceClient);
    const id = clean(payload.id) ?? "";
    const entry = aboutPayload(payload);

    if (!id) {
      return NextResponse.json({ error: "수정할 항목 ID가 없습니다." }, { status: 400 });
    }

    if (!entry.title) {
      return NextResponse.json({ error: "이름 또는 제목을 입력해 주세요." }, { status: 400 });
    }

    const { error } = await admin.serviceClient
      .from("about_entries")
      .update({ ...entry, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "수정에 실패했어요." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "삭제할 항목 ID가 없습니다." }, { status: 400 });
  }

  const { error } = await admin.serviceClient.from("about_entries").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
