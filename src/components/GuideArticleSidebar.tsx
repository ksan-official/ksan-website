"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Check, ListTree, X } from "lucide-react";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export type GuideHeading = {
  id: string;
  level: 1 | 2 | 3;
  text: string;
};

export function GuideArticleSidebar({ headings, slug }: { headings: GuideHeading[]; slug: string }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-18% 0px -68%", threshold: [0, 1] }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const nextUserId = data.session?.user.id ?? null;
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
  }, [slug]);

  async function toggleSaved() {
    if (!hasSupabaseConfig() || !userId) {
      router.push(`/auth?next=/guides/${slug}`);
      return;
    }

    setSaving(true);
    setNotice(null);
    const supabase = createBrowserSupabaseClient();
    const result = saved
      ? await supabase
          .from("saved_guides")
          .delete()
          .eq("user_id", userId)
          .eq("guide_slug", slug)
      : await supabase
          .from("saved_guides")
          .upsert({ guide_slug: slug, user_id: userId } as never);

    if (result.error) {
      setNotice("저장 상태를 변경하지 못했어요.");
    } else {
      setSaved(!saved);
      setNotice(saved ? "저장을 취소했어요." : "마이페이지에 저장했어요.");
    }
    setSaving(false);
    window.setTimeout(() => setNotice(null), 2400);
  }

  return (
    <aside className="guide-article-sidebar">
      <button
        aria-pressed={saved}
        className="guide-save-button"
        disabled={saving}
        onClick={toggleSaved}
        type="button"
      >
        <span>{saved ? <Check aria-hidden size={17} /> : <Bookmark aria-hidden size={17} />}</span>
        <div>
          <strong>{saved ? "저장됨" : "가이드 저장"}</strong>
          <small>{saved ? "마이페이지에서 다시 볼 수 있어요" : "로그인하고 나중에 다시 보기"}</small>
        </div>
      </button>

      {headings.length ? (
        <button
          aria-expanded={tocOpen}
          className="guide-toc-toggle"
          onClick={() => setTocOpen((current) => !current)}
          type="button"
        >
          {tocOpen ? <X aria-hidden size={18} /> : <ListTree aria-hidden size={18} />}
          목차
        </button>
      ) : null}

      {headings.length ? (
        <nav aria-label="글 목차" className={`guide-toc-card${tocOpen ? " is-open" : ""}`}>
          <p>목차</p>
          <div>
            {headings.map((heading) => (
              <a
                aria-current={activeId === heading.id ? "location" : undefined}
                data-level={heading.level}
                href={`#${heading.id}`}
                key={heading.id}
                onClick={() => {
                  setActiveId(heading.id);
                  setTocOpen(false);
                }}
              >
                {heading.level === 3 ? <span aria-hidden>└</span> : null}
                {heading.text}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
      {notice ? <p aria-live="polite" className="guide-save-notice">{notice}</p> : null}
    </aside>
  );
}
