import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";

function isGoogleFormUrl(value: unknown) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "forms.gle" ||
      url.hostname === "forms.google.com" ||
      (url.hostname === "docs.google.com" && url.pathname.startsWith("/forms/"))
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const admin = await requireAdmin(accessToken);

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: 401 });
  }

  const payload = await request.json();
  if (!isGoogleFormUrl(payload.registrationTarget)) {
    return NextResponse.json({ error: "올바른 Google Form 링크를 입력해주세요." }, { status: 400 });
  }

  const { data, error } = await admin.serviceClient
    .from("events")
    .insert({
      title: payload.title,
      starts_at: payload.startsAt,
      location: payload.location,
      description: payload.description,
      registration_mode: "google_form",
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
