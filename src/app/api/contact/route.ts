import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";

const inquiryTypes = new Set(["partnership", "program", "career", "media", "other"]);

type ContactRequest = {
  email?: unknown;
  inquiryType?: unknown;
  message?: unknown;
  name?: unknown;
  organization?: unknown;
  website?: unknown;
};

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const payload = (await request.json()) as ContactRequest;

  if (clean(payload.website, 100)) {
    return NextResponse.json({ ok: true });
  }

  const inquiryType = clean(payload.inquiryType, 40);
  const name = clean(payload.name, 100);
  const email = clean(payload.email, 240).toLowerCase();
  const organization = clean(payload.organization, 160) || null;
  const message = clean(payload.message, 4000);

  if (!inquiryTypes.has(inquiryType) || !name || !email || !message) {
    return NextResponse.json({ error: "필수 항목을 모두 확인해주세요." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "올바른 이메일 주소를 입력해주세요." }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("contact_inquiries").insert({
      email,
      inquiry_type: inquiryType,
      message,
      name,
      organization,
      status: "new"
    });

    if (error) {
      return NextResponse.json({ error: "문의 저장에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "문의 접수 기능을 연결하는 중입니다. Supabase 설정 후 이용해주세요." },
      { status: 503 }
    );
  }
}
