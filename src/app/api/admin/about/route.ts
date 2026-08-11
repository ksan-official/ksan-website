import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  const { data, error } = await admin.serviceClient
    .from("about_entries")
    .insert({
      entry_type: payload.entryType,
      title: payload.title,
      subtitle: payload.subtitle || null,
      body: payload.body || null,
      image_url: payload.imageUrl || null,
      sort_order: Number(payload.sortOrder || 0),
      published: Boolean(payload.published)
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
