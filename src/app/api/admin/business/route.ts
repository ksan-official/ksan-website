import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

const businessImageBucket = "business-post-images";

function accessToken(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function boolValue(value: unknown) {
  return value === true || value === "true" || value === "on";
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((tag) => String(tag).trim()).filter(Boolean))).slice(0, 8);
}

async function ensureBusinessImageBucket(serviceClient: SupabaseClient) {
  const { error: getError } = await serviceClient.storage.getBucket(businessImageBucket);

  if (!getError) return null;

  const { error: createError } = await serviceClient.storage.createBucket(businessImageBucket, {
    public: true
  });

  return createError;
}

async function fileToDataUrl(photo: File) {
  const buffer = Buffer.from(await photo.arrayBuffer());
  return `data:${photo.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
}

async function uploadBusinessImage(
  serviceClient: SupabaseClient,
  photo: FormDataEntryValue | null,
  postTitle: string,
  index = 0
) {
  if (!(photo instanceof File) || photo.size === 0) return null;

  if (!photo.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드할 수 있어요.");
  }

  const bucketError = await ensureBusinessImageBucket(serviceClient);
  if (bucketError) {
    console.warn("Business image bucket unavailable, saving image inline instead.", bucketError.message);
    return fileToDataUrl(photo);
  }

  const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeTitle = postTitle.replace(/[^a-z0-9_-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "business-post";
  const path = `${safeTitle}/${Date.now()}-${index}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await serviceClient.storage
    .from(businessImageBucket)
    .upload(path, photo, {
      cacheControl: "3600",
      contentType: photo.type,
      upsert: false
    });

  if (uploadError) {
    console.warn("Business image upload failed, saving image inline instead.", uploadError.message);
    return fileToDataUrl(photo);
  }

  const { data } = serviceClient.storage.from(businessImageBucket).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadBusinessImages(serviceClient: SupabaseClient, photos: FormDataEntryValue[], postTitle: string) {
  const uploads = await Promise.all(
    photos.map((photo, index) => uploadBusinessImage(serviceClient, photo, postTitle, index))
  );
  return uploads.filter((url): url is string => Boolean(url));
}

function parseImageUrls(value: unknown) {
  if (Array.isArray(value)) return value.map((url) => String(url).trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((url) => String(url).trim()).filter(Boolean);
  } catch {
    return value.split(",").map((url) => url.trim()).filter(Boolean);
  }
  return [];
}

async function orderedImageUrls(formData: FormData, serviceClient: SupabaseClient, postTitle: string) {
  const rawOrder = clean(formData.get("imageOrder"));
  if (!rawOrder) return null;

  let items: Array<{ field?: string; kind?: string; url?: string }>;
  try {
    const parsed = JSON.parse(rawOrder);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }

  const urls: string[] = [];
  for (const [index, item] of items.entries()) {
    if (item.kind === "existing" && item.url) {
      urls.push(item.url);
    }
    if (item.kind === "upload" && item.field) {
      const uploadedUrl = await uploadBusinessImage(serviceClient, formData.get(item.field), postTitle, index);
      if (uploadedUrl) urls.push(uploadedUrl);
    }
  }

  return urls;
}

async function requestPayload(request: Request, serviceClient: SupabaseClient) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return request.json();
  }

  const formData = await request.formData();
  const title = clean(formData.get("title")) ?? "business-post";
  const uploadedLogoUrl = await uploadBusinessImage(serviceClient, formData.get("logo"), `${title}-logo`);
  const orderedUrls = await orderedImageUrls(formData, serviceClient, title);
  const imageUrls = orderedUrls ?? [
    ...parseImageUrls(formData.get("imageUrls")),
    ...await uploadBusinessImages(
      serviceClient,
      [...formData.getAll("photos"), formData.get("photo")].filter(Boolean) as FormDataEntryValue[],
      title
    )
  ];

  return {
    accent: clean(formData.get("accent")),
    applyMode: clean(formData.get("applyMode")),
    applyTarget: clean(formData.get("applyTarget")),
    company: clean(formData.get("company")),
    companyIntro: clean(formData.get("companyIntro")),
    deadline: clean(formData.get("deadline")),
    department: clean(formData.get("department")),
    description: clean(formData.get("description")) ?? "",
    employmentType: clean(formData.get("employmentType")),
    featured: boolValue(formData.get("featured")),
    featuredOrder: clean(formData.get("featuredOrder")),
    id: clean(formData.get("id")),
    imageUrl: imageUrls[0] ?? clean(formData.get("imageUrl")),
    imageUrls,
    location: clean(formData.get("location")),
    logoUrl: uploadedLogoUrl ?? clean(formData.get("logoUrl")),
    published: boolValue(formData.get("published")),
    requirements: clean(formData.get("requirements")),
    responsibilities: clean(formData.get("responsibilities")),
    tags: [],
    title
  };
}

export async function GET(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  const { data, error } = await admin.serviceClient
    .from("business_posts")
    .select("id,title,company,location,employment_type,deadline,apply_mode,apply_target,description,department,tags,featured,featured_order,published,created_at,company_intro,responsibilities,requirements,accent,image_url,image_urls,logo_url")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = data ?? [];
  const postIds = posts.map((post) => String(post.id));
  const savedCounts = new Map<string, number>();

  if (postIds.length) {
    const [savedItemsResult, savedPostsResult] = await Promise.all([
      admin.serviceClient.from("saved_business_items").select("user_id,job_id").in("job_id", postIds),
      admin.serviceClient.from("saved_business_posts").select("user_id,business_post_id").in("business_post_id", postIds)
    ]);

    if (savedItemsResult.error) return NextResponse.json({ error: savedItemsResult.error.message }, { status: 500 });
    if (savedPostsResult.error) return NextResponse.json({ error: savedPostsResult.error.message }, { status: 500 });

    const countedSaves = new Set<string>();
    for (const item of (savedItemsResult.data ?? []) as Array<{ job_id?: string | null; user_id?: string | null }>) {
      const postId = item.job_id ?? "";
      const userId = item.user_id ?? "";
      if (!postId || !userId) continue;
      const key = `${userId}:${postId}`;
      if (countedSaves.has(key)) continue;
      countedSaves.add(key);
      savedCounts.set(postId, (savedCounts.get(postId) ?? 0) + 1);
    }
    for (const item of (savedPostsResult.data ?? []) as Array<{ business_post_id?: string | null; user_id?: string | null }>) {
      const postId = item.business_post_id ?? "";
      const userId = item.user_id ?? "";
      if (!postId || !userId) continue;
      const key = `${userId}:${postId}`;
      if (countedSaves.has(key)) continue;
      countedSaves.add(key);
      savedCounts.set(postId, (savedCounts.get(postId) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    posts: posts.map((post) => ({
      ...post,
      saved_count: savedCounts.get(String(post.id)) ?? 0
    }))
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  let payload: Awaited<ReturnType<typeof requestPayload>>;
  try {
    payload = await requestPayload(request, admin.serviceClient);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "업로드에 실패했습니다." }, { status: 400 });
  }
  const row = {
    apply_mode: payload.applyMode,
    apply_target: payload.applyTarget,
    company: payload.company,
    company_intro: payload.companyIntro || null,
    deadline: payload.deadline || null,
    department: payload.department || null,
    description: payload.description ?? "",
    employment_type: payload.employmentType,
    featured: false,
    featured_order: 0,
    image_url: payload.imageUrl,
    image_urls: payload.imageUrls,
    location: payload.location,
    logo_url: payload.logoUrl,
    published: Boolean(payload.published),
    requirements: payload.requirements || null,
    responsibilities: payload.responsibilities || null,
    tags: cleanTags(payload.tags),
    title: payload.title
  };
  const insertRow = { ...row, accent: payload.accent ?? "orange" };
  const { data, error } = await admin.serviceClient.from("business_posts").insert(insertRow as never).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "공고 저장 결과를 확인하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  let payload: Awaited<ReturnType<typeof requestPayload>>;
  try {
    payload = await requestPayload(request, admin.serviceClient);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "업로드에 실패했습니다." }, { status: 400 });
  }
  if (!payload.id) return NextResponse.json({ error: "공고 ID가 필요합니다." }, { status: 400 });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const editableFields: Array<[string, string]> = [
    ["accent", "accent"], ["applyMode", "apply_mode"], ["applyTarget", "apply_target"],
    ["company", "company"], ["companyIntro", "company_intro"], ["deadline", "deadline"], ["department", "department"],
    ["description", "description"], ["employmentType", "employment_type"],
    ["imageUrl", "image_url"], ["imageUrls", "image_urls"], ["location", "location"], ["logoUrl", "logo_url"], ["requirements", "requirements"], ["responsibilities", "responsibilities"], ["title", "title"]
  ];
  editableFields.forEach(([inputKey, column]) => {
    if (payload[inputKey] !== undefined) patch[column] = inputKey === "deadline" ? payload[inputKey] || null : payload[inputKey];
  });
  if (typeof payload.published === "boolean") patch.published = payload.published;
  if (typeof payload.featured === "boolean") patch.featured = false;
  if (payload.featuredOrder !== undefined) patch.featured_order = 0;
  if (payload.tags !== undefined) patch.tags = cleanTags(payload.tags);

  const { error } = await admin.serviceClient.from("business_posts").update(patch as never).eq("id", payload.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(accessToken(request));
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  let ids = id ? [id] : [];

  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = await request.json();
      if (Array.isArray(body.ids)) {
        ids = body.ids.map((value: unknown) => String(value)).filter(Boolean);
      }
    } catch {
      ids = [];
    }
  }

  if (!ids.length) return NextResponse.json({ error: "공고 ID가 필요합니다." }, { status: 400 });

  const { error } = await admin.serviceClient.from("business_posts").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deletedCount: ids.length });
}
