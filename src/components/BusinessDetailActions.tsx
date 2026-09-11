"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bookmark } from "lucide-react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

type BusinessDetailActionsProps = {
  applyTarget: string;
  jobId: string;
};

export function BusinessDetailActions({ applyTarget, jobId }: BusinessDetailActionsProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const externalApply = !applyTarget.startsWith("mailto:");

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    let active = true;
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const nextUserId = data.session?.user.id ?? null;
      setUserId(nextUserId);
      if (!nextUserId) return;

      const { data: savedJob } = await supabase
        .from("saved_business_items")
        .select("job_id")
        .eq("user_id", nextUserId)
        .eq("job_id", jobId)
        .maybeSingle();
      if (active) setSaved(Boolean(savedJob));
    });

    return () => {
      active = false;
    };
  }, [jobId]);

  async function toggleSaved() {
    if (!hasSupabaseConfig() || !userId) {
      router.push(`/auth?next=/business/${jobId}`);
      return;
    }

    setSaving(true);
    setNotice(null);
    const supabase = createBrowserSupabaseClient();
    const result = saved
      ? await supabase
          .from("saved_business_items")
          .delete()
          .eq("user_id", userId)
          .eq("job_id", jobId)
      : await supabase
          .from("saved_business_items")
          .upsert({ job_id: jobId, user_id: userId } as never);

    if (result.error) {
      setNotice("저장 상태를 변경하지 못했어요.");
    } else {
      setSaved((current) => !current);
      setNotice(
        saved
          ? "저장을 취소했어요."
          : "마이페이지에 저장했어요."
      );
    }
    setSaving(false);
    window.setTimeout(() => setNotice(null), 2400);
  }

  return (
    <div className="business-detail-primary-actions">
      <a href={applyTarget} rel={externalApply ? "noreferrer" : undefined} target={externalApply ? "_blank" : undefined}>
        <span>지원하기</span>
        <ArrowUpRight aria-hidden size={18} />
      </a>
      <button aria-label={saved ? "저장 취소" : "저장하기"} aria-pressed={saved} disabled={saving} onClick={toggleSaved} type="button">
        <Bookmark aria-hidden fill={saved ? "currentColor" : "none"} size={20} />
        <span className="sr-only">{saved ? "저장됨" : "저장하기"}</span>
      </button>
      {notice ? <p aria-live="polite">{notice}</p> : null}
    </div>
  );
}
