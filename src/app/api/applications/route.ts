import { NextResponse } from "next/server";
import { appendToGoogleSheet } from "@/lib/googleSheets";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

type ApplicationRequest = {
  type?: "business_application" | "event_registration";
  targetId?: string;
  name?: string;
  email?: string;
  school?: string;
  major?: string;
  admissionYear?: string;
  message?: string;
};

function clean(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ApplicationRequest;
  const type = payload.type;

  if (type !== "business_application" && type !== "event_registration") {
    return NextResponse.json({ error: "Invalid application type." }, { status: 400 });
  }

  if (!payload.targetId || !payload.name || !payload.email) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "");
  let userId: string | null = null;

  if (accessToken) {
    const authClient = createServerSupabaseClient(accessToken);
    const { data } = await authClient.auth.getUser();
    userId = data.user?.id ?? null;
  }

  const serviceClient = createServiceSupabaseClient();
  const submittedAt = new Date().toISOString();
  const row = {
    user_id: userId,
    application_type: type,
    target_id: payload.targetId,
    full_name: clean(payload.name),
    email: clean(payload.email),
    school: clean(payload.school),
    major: clean(payload.major),
    admission_year: clean(payload.admissionYear),
    message: clean(payload.message),
    submitted_at: submittedAt,
    sheets_sync_status: "pending"
  };

  const { data, error } = await serviceClient.from("applications").insert(row).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sheetsResult = await appendToGoogleSheet({
    type,
    submittedAt,
    values: {
      applicationId: data.id,
      targetId: payload.targetId,
      name: clean(payload.name),
      email: clean(payload.email),
      school: clean(payload.school),
      major: clean(payload.major),
      admissionYear: clean(payload.admissionYear),
      message: clean(payload.message)
    }
  });

  await serviceClient
    .from("applications")
    .update({
      sheets_sync_status: sheetsResult.ok ? "synced" : sheetsResult.skipped ? "skipped" : "failed",
      sheets_sync_error: sheetsResult.ok ? null : JSON.stringify(sheetsResult)
    })
    .eq("id", data.id);

  return NextResponse.json({
    id: data.id,
    sheetsSyncStatus: sheetsResult.ok ? "synced" : sheetsResult.skipped ? "skipped" : "failed"
  });
}
