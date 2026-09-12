"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { AdminGuideWebsitePreview } from "@/components/AdminGuideWebsitePreview";
import { guideCategories, resolveGuideCategory } from "@/lib/guide-structure";
import { formatGuideTagsInput, parseGuideTags } from "@/lib/guideTags";
import type { GuideBlock } from "@/lib/types";

type AdminGuideOption = {
  category: string;
  id: string;
  published: boolean;
  slug: string;
  title: string;
};

export default function NewGuidePage() {
  const [status, setStatus] = useState<string | null>(null);
  const [notionUrl, setNotionUrl] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("KSAN 기획총괄팀");
  const [category, setCategory] = useState("residency");
  const [importedBlocks, setImportedBlocks] = useState<GuideBlock[] | null>(null);
  const [notionLoading, setNotionLoading] = useState(false);
  const [published, setPublished] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [guideOptions, setGuideOptions] = useState<AdminGuideOption[]>([]);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [relatedCategory, setRelatedCategory] = useState("residency");
  const previewBlocks = importedBlocks ?? [];
  const filteredRelatedGuides = useMemo(
    () => guideOptions.filter((guide) => resolveGuideCategory(guide.category).id === relatedCategory && guide.slug !== slug),
    [guideOptions, relatedCategory, slug]
  );

  useEffect(() => {
    if (!status || status.includes("중입니다")) return;
    const timeout = window.setTimeout(() => setStatus(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    async function loadGuideOptions() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        const response = await fetch("/api/admin/guides", {
          headers: { Authorization: `Bearer ${data.session.access_token}` }
        });
        const result = await response.json();
        if (response.ok) setGuideOptions(result.guides ?? []);
      } catch {
        setGuideOptions([]);
      }
    }

    void loadGuideOptions();
  }, []);

  function toggleRelatedGuide(id: string) {
    setRelatedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  async function scanNotion() {
    if (!notionUrl.trim()) {
      setStatus("Notion 링크를 먼저 입력해주세요.");
      return;
    }

    setNotionLoading(true);
    setStatus("Notion 문서를 불러오는 중입니다…");
    let supabase;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      setStatus("연결 설정이 없습니다. 로컬 .env.local에 Supabase 환경변수를 설정한 뒤 개발 서버를 다시 시작해주세요.");
      setNotionLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus("불러오기 실패: 관리자 계정으로 먼저 로그인해야 합니다.");
      setNotionLoading(false);
      return;
    }

    const response = await fetch("/api/admin/guides", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({ notionUrl })
    });
    const result = await response.json();
    if (response.ok) {
      setTitle(result.title);
      setSlug(result.slug);
      setSummary(result.summary);
      setAuthor(result.author ?? "KSAN 기획총괄팀");
      setTags(formatGuideTagsInput(result.tags ?? []));
      setImportedBlocks(Array.isArray(result.blocks) ? result.blocks : null);
      setStatus(`Notion 연결 완료: ${result.blocks?.length ?? 0}개 블록을 확인했습니다.`);
    } else {
      setStatus(`불러오기 실패: ${result.error}`);
    }
    setNotionLoading(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let supabase;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      setStatus("저장 실패: 로컬 Supabase 환경변수가 없습니다. .env.local 설정 후 서버를 다시 시작해주세요.");
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus("저장 실패: 관리자 계정으로 먼저 로그인해야 합니다.");
      return;
    }

    const response = await fetch("/api/admin/guides", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`
      },
      body: JSON.stringify({
        title,
        slug,
        summary,
        rawText: "",
        category,
        author,
        tags,
        notionUrl,
        published,
        relatedIds
      })
    });
    const result = await response.json();
    setStatus(response.ok ? "가이드가 저장되었습니다." : `저장 실패: ${result.error}`);
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">정착가이드</p>
          <h1>글 작성</h1>
        </div>
        <Link className="admin-button secondary" href="/admin/guides">
          목록으로
        </Link>
      </header>

      <section>
        <form className="admin-form" id="new-guide-form" onSubmit={submit}>
          <label className="field">
            <span>Notion 글 링크</span>
            <input
              onChange={(event) => setNotionUrl(event.target.value)}
              placeholder="https://www.notion.so/..."
              type="url"
              value={notionUrl}
            />
          </label>
          <button className="admin-button secondary" disabled={notionLoading} type="button" onClick={scanNotion}>
            {notionLoading ? "Notion 확인 중…" : "Notion 내용 불러오기"}
          </button>
          <label className="field">
            <span>카테고리</span>
            <select name="category" onChange={(event) => setCategory(event.target.value)} value={category}>
              {guideCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.title}</option>
              ))}
            </select>
          </label>
          <label className="admin-check">
            <input checked={published} onChange={(event) => setPublished(event.target.checked)} type="checkbox" /> 공개
          </label>
          <fieldset className="admin-related-guides">
            <legend>연관 가이드</legend>
            <p>글 하단에 보여줄 가이드를 최대 3개까지 선택할 수 있어요. 현재 {relatedIds.length}/3개 선택됨</p>
            <label className="field">
              <span>연관 가이드 카테고리</span>
              <select onChange={(event) => setRelatedCategory(event.target.value)} value={relatedCategory}>
                {guideCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.title}</option>
                ))}
              </select>
            </label>
            {guideOptions.length ? (
              <div>
                {filteredRelatedGuides.length ? filteredRelatedGuides.map((guide) => {
                  const checked = relatedIds.includes(guide.id);
                  const disabled = !checked && relatedIds.length >= 3;
                  const guideCategory = resolveGuideCategory(guide.category);
                  return (
                    <label className="admin-related-guide-option" key={guide.id}>
                      <input
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleRelatedGuide(guide.id)}
                        type="checkbox"
                      />
                      <span>
                        <strong>{guide.title}</strong>
                        <small>{guideCategory.title} · {guide.published ? "공개" : "비공개"}</small>
                      </span>
                    </label>
                  );
                }) : <span className="admin-form-note">이 카테고리에 선택할 수 있는 가이드가 없습니다.</span>}
              </div>
            ) : (
              <span className="admin-form-note">아직 선택할 수 있는 가이드가 없습니다.</span>
            )}
          </fieldset>
          <button
            className={`admin-button admin-preview-open-button${previewBlocks.length ? " is-ready" : ""}`}
            disabled={!previewBlocks.length}
            type="button"
            onClick={() => setPreviewOpen(true)}
          >
            <Maximize2 aria-hidden size={16} /> {previewBlocks.length ? "미리보기 준비됨" : "미리보기 준비 전"}
          </button>
          <button className="admin-button" type="submit">
            저장
          </button>
        </form>
      </section>
      {previewOpen ? (
        <div className="admin-preview-modal" role="dialog" aria-modal="true" aria-label="가이드 풀스크린 미리보기">
          <button className="admin-preview-close" type="button" onClick={() => setPreviewOpen(false)}>
            <X aria-hidden size={18} /> 닫기
          </button>
          <AdminGuideWebsitePreview
            blocks={previewBlocks}
            categoryEmoji={guideCategories.find((item) => item.id === category)?.emoji}
            categoryTitle={guideCategories.find((item) => item.id === category)?.title ?? "정착가이드"}
            headingIdPrefix="preview-"
            tags={parseGuideTags(tags)}
            title={title || "제목 없음"}
            updatedAt="미리보기"
          />
        </div>
      ) : null}
      {status ? (
        <p aria-live="polite" className={`admin-toast${status.includes("중입니다") ? " is-loading" : ""}`}>
          {status}
        </p>
      ) : null}
    </main>
  );
}
