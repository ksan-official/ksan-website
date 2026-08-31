import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

const profilePhotoBucket = "profile-photos";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function admissionYear(value: FormDataEntryValue | null) {
  const cleaned = clean(value);
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

async function ensureProfilePhotoBucket() {
  const serviceClient = createServiceSupabaseClient();
  const { error: getError } = await serviceClient.storage.getBucket(profilePhotoBucket);

  if (!getError) return { serviceClient, error: null };

  const { error: createError } = await serviceClient.storage.createBucket(profilePhotoBucket, {
    public: true
  });

  return { serviceClient, error: createError };
}

export async function PATCH(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.replace(/^Bearer\s+/i, "");

  if (!accessToken) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const authClient = createServerSupabaseClient(accessToken);
  const { data: authData, error: authError } = await authClient.auth.getUser();
  const user = authData.user;

  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await request.formData();
  const photo = formData.get("photo");
  let avatarUrl: string | null = null;

  const { serviceClient, error: bucketError } = await ensureProfilePhotoBucket();
  if (bucketError) {
    return NextResponse.json({ error: "프로필 사진 저장소를 준비하지 못했어요." }, { status: 500 });
  }

  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있어요." }, { status: 400 });
    }

    const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await serviceClient.storage
      .from(profilePhotoBucket)
      .upload(path, photo, {
        cacheControl: "3600",
        contentType: photo.type,
        upsert: true
      });

    if (uploadError) {
      return NextResponse.json({ error: "프로필 사진 업로드에 실패했어요." }, { status: 500 });
    }

    const { data } = serviceClient.storage.from(profilePhotoBucket).getPublicUrl(path);
    avatarUrl = data.publicUrl;
  }

  const profile = {
    id: user.id,
    email: user.email ?? "",
    full_name: clean(formData.get("fullName")),
    school: clean(formData.get("school")),
    major: clean(formData.get("major")),
    admission_year: admissionYear(formData.get("admissionYear")),
    updated_at: new Date().toISOString()
  };

  const profileWithAvatar = avatarUrl ? { ...profile, avatar_url: avatarUrl } : profile;
  const { error } = await serviceClient
    .from("profiles")
    .upsert(profileWithAvatar, { onConflict: "id" });

  if (!error) {
    return NextResponse.json({ avatarUrl, profile: profileWithAvatar });
  }

  if (avatarUrl && /avatar_url/i.test(error.message)) {
    const { error: fallbackError } = await serviceClient
      .from("profiles")
      .upsert(profile, { onConflict: "id" });

    if (!fallbackError) {
      return NextResponse.json({
        avatarUrl,
        profile,
        warning: "사진은 업로드됐지만 avatar_url 컬럼이 아직 없어 새로고침 후에는 사진이 유지되지 않을 수 있어요."
      });
    }
  }

  return NextResponse.json({ error: error.message }, { status: 500 });
}
