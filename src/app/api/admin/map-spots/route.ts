import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { parseGoogleMapsLink } from "@/lib/googleMapsLink";

const categories = new Set(["cafe", "food", "study"]);
const selectColumns = [
  "id",
  "address",
  "category",
  "city",
  "created_at",
  "description",
  "google_maps_url",
  "latitude",
  "longitude",
  "name",
  "neighborhood",
  "published",
  "slug",
  "sort_order",
  "source_list_url",
  "updated_at"
].join(",");

function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  const googleMapsUrl = String(payload.googleMapsUrl ?? "").trim();
  const parsedMapsLink = googleMapsUrl ? await parseGoogleMapsLink(googleMapsUrl) : null;
  const latitude = Number(payload.latitude || parsedMapsLink?.latitude);
  const longitude = Number(payload.longitude || parsedMapsLink?.longitude);
  const name = String(payload.name || parsedMapsLink?.name || "").trim();
  const category = String(payload.category ?? "");

  if (!name || !categories.has(category) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({
      error: "Google Maps 링크에서 장소명과 좌표를 찾지 못했습니다. Google Maps 장소 페이지에서 공유한 전체 링크를 붙여넣거나, 표시 이름/좌표를 직접 입력해주세요."
    }, { status: 400 });
  }

  const slug = toSlug(String(payload.slug || name)) || `spot-${Date.now()}`;
  const { data, error } = await admin.serviceClient
    .from("map_spots")
    .upsert({
      address: payload.address || null,
      category,
      city: payload.city || null,
      description: payload.description || null,
      google_maps_url: parsedMapsLink?.url || googleMapsUrl || null,
      latitude,
      longitude,
      name,
      neighborhood: payload.neighborhood || null,
      published: Boolean(payload.published),
      slug,
      sort_order: Number(payload.sortOrder) || 0,
      source_list_url: payload.sourceListUrl || null
    }, { onConflict: "slug" })
    .select("id,slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const { data, error } = await admin.serviceClient
    .from("map_spots")
    .select(selectColumns)
    .order("published", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ spots: data ?? [] });
}

export async function PATCH(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  if (!payload.id) {
    return NextResponse.json({ error: "장소 ID가 필요합니다." }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (payload.googleMapsUrl !== undefined) {
    const googleMapsUrl = String(payload.googleMapsUrl ?? "").trim();
    const parsedMapsLink = googleMapsUrl ? await parseGoogleMapsLink(googleMapsUrl) : null;
    const latitude = Number(payload.latitude || parsedMapsLink?.latitude);
    const longitude = Number(payload.longitude || parsedMapsLink?.longitude);
    const name = String(payload.name || parsedMapsLink?.name || "").trim();

    if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({
        error: "장소명과 좌표가 필요합니다. 링크에서 자동 인식이 안 되면 직접 입력해주세요."
      }, { status: 400 });
    }

    patch.google_maps_url = parsedMapsLink?.url || googleMapsUrl || null;
    patch.latitude = latitude;
    patch.longitude = longitude;
    patch.name = name;
  }

  if (payload.slug !== undefined) patch.slug = toSlug(String(payload.slug)) || `spot-${Date.now()}`;
  if (payload.category !== undefined) {
    const category = String(payload.category ?? "");
    if (!categories.has(category)) {
      return NextResponse.json({ error: "지원하지 않는 카테고리입니다." }, { status: 400 });
    }
    patch.category = category;
  }
  if (payload.address !== undefined) patch.address = payload.address || null;
  if (payload.city !== undefined) patch.city = payload.city || null;
  if (payload.description !== undefined) patch.description = payload.description || null;
  if (payload.neighborhood !== undefined) patch.neighborhood = payload.neighborhood || null;
  if (typeof payload.published === "boolean") patch.published = payload.published;
  if (payload.sortOrder !== undefined) patch.sort_order = Number(payload.sortOrder) || 0;
  if (payload.sourceListUrl !== undefined) patch.source_list_url = payload.sourceListUrl || null;

  const { error } = await admin.serviceClient
    .from("map_spots")
    .update(patch as never)
    .eq("id", payload.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "장소 ID가 필요합니다." }, { status: 400 });
  }

  const { error } = await admin.serviceClient.from("map_spots").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
