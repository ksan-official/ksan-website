"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type GuideSaveButtonProps = {
  slug: string;
};

export function GuideSaveButton({ slug }: GuideSaveButtonProps) {
  const router = useRouter();
  const configured = hasSupabaseConfig();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<string | null>(configured ? null : "계정 기능 준비 중");

  useEffect(() => {
    if (!configured) return;

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const nextUserId = data.user?.id ?? null;
      setUserId(nextUserId);
      if (!nextUserId) return;

      const { data: savedGuide } = await supabase
        .from("saved_guides")
        .select("guide_slug")
        .eq("user_id", nextUserId)
        .eq("guide_slug", slug)
        .maybeSingle();
      setSaved(Boolean(savedGuide));
    });
  }, [configured, slug]);

  async function toggleSaved() {
    if (!configured) {
      setStatus("계정 기능 준비 중");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const nextUserId = data.user?.id ?? userId;
    if (!nextUserId) {
      router.push("/auth");
      return;
    }

    setStatus("처리 중");
    const result = saved
      ? await supabase.from("saved_guides").delete().eq("user_id", nextUserId).eq("guide_slug", slug)
      : await supabase.from("saved_guides").upsert({ guide_slug: slug, user_id: nextUserId } as never);

    if (result.error) {
      setStatus(`저장 실패: ${result.error.message}`);
      return;
    }

    setUserId(nextUserId);
    setSaved(!saved);
    setStatus(saved ? "저장을 취소했습니다." : "마이페이지에 저장했습니다.");
  }

  return (
    <div className="guide-save-control">
      <button className="button secondary" type="button" onClick={toggleSaved}>
        <Bookmark size={18} aria-hidden />
        {saved ? "저장됨" : "가이드 저장"}
      </button>
      {status ? <span className="muted">{status}</span> : null}
    </div>
  );
}
