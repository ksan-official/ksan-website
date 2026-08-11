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
    .from("business_posts")
    .insert({
      title: payload.title,
      company: payload.company,
      location: payload.location,
      employment_type: payload.employmentType,
      deadline: payload.deadline || null,
      apply_mode: payload.applyMode,
      apply_target: payload.applyTarget,
      description: payload.description,
      published: Boolean(payload.published)
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
