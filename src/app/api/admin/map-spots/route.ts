import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

const categories = new Set(["cafe", "food", "study"]);

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
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  const name = String(payload.name ?? "").trim();
  const category = String(payload.category ?? "");

  if (!name || !categories.has(category) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "장소명, 카테고리, 올바른 위도와 경도가 필요합니다." }, { status: 400 });
  }

  const slug = toSlug(String(payload.slug || name)) || `spot-${Date.now()}`;
  const { data, error } = await admin.serviceClient
    .from("map_spots")
    .insert({
      address: payload.address || null,
      category,
      description: payload.description || null,
      google_maps_url: payload.googleMapsUrl || null,
      latitude,
      longitude,
      name,
      neighborhood: payload.neighborhood || null,
      published: Boolean(payload.published),
      slug,
      sort_order: Number(payload.sortOrder) || 0,
      source_list_url: payload.sourceListUrl || null
    })
    .select("id,slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
