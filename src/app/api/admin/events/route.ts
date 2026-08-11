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
    .from("events")
    .insert({
      title: payload.title,
      starts_at: payload.startsAt,
      location: payload.location,
      description: payload.description,
      registration_mode: payload.registrationMode,
      registration_target: payload.registrationTarget,
      published: Boolean(payload.published)
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
