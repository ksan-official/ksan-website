"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminGuideWebsitePreview } from "@/components/AdminGuideWebsitePreview";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { resolveGuideCategory } from "@/lib/guide-structure";
import type { GuideBlock } from "@/lib/types";

type PreviewGuide = {
  author: string | null;
  blocks: GuideBlock[] | null;
  category: string;
  id: string;
  published: boolean;
  slug: string;
  tags: string[] | null;
  title: string;
  updated_at: string;
};

export default function AdminGuidePreviewPage() {
  const params = useParams<{ id: string }>();
  const [guide, setGuide] = useState<PreviewGuide | null>(null);
  const [status, setStatus] = useState("미리보기를 불러오는 중입니다.");

  const request = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return fetch("/api/admin/guides", {
      headers: { Authorization: `Bearer ${data.session.access_token}` }
    });
  }, []);

  useEffect(() => {
    async function loadGuide() {
      try {
        const response = await request();
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        const match = (result.guides as PreviewGuide[]).find((item) => item.id === params.id) ?? null;
        if (!match) throw new Error("가이드를 찾지 못했습니다.");
        setGuide(match);
        setStatus("");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "미리보기를 불러오지 못했습니다.");
      }
    }

    void loadGuide();
  }, [params.id, request]);

  const category = guide ? resolveGuideCategory(guide.category) : null;

  if (!guide) {
    return (
      <main className="admin-page" id="main">
        <section className="admin-section">
          <p className="admin-note">{status}</p>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="admin-preview-floating-bar">
        <div>
          <Link href={`/admin/guides/${guide.id}/edit`}>수정으로 돌아가기</Link>
          <span>{guide.published ? "공개 글 미리보기" : "비공개 글 미리보기"}</span>
        </div>
      </div>
      <AdminGuideWebsitePreview
        blocks={guide.blocks ?? []}
        categoryEmoji={category?.emoji}
        categoryTitle={category?.title ?? guide.category}
        tags={guide.tags ?? []}
        title={guide.title}
        updatedAt={guide.updated_at.slice(0, 10)}
      />
    </>
  );
}
