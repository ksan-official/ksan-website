"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { AdminGuideWebsitePreview } from "@/components/AdminGuideWebsitePreview";
import { formatGuideTagsInput, parseGuideTags } from "@/lib/guideTags";
import { guideCategories, resolveGuideCategory } from "@/lib/guide-structure";
import type { GuideBlock } from "@/lib/types";

type EditableGuide = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  author: string | null;
  tags: string[] | null;
  raw_text: string;
  blocks: GuideBlock[] | null;
  notion_url?: string | null;
  published: boolean;
  related_ids?: string[] | null;
};

type AdminGuideOption = Pick<EditableGuide, "category" | "id" | "published" | "title">;

export default function EditGuidePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [status, setStatus] = useState("가이드를 불러오는 중입니다.");
  const [guide, setGuide] = useState<EditableGuide | null>(null);
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [notionUrl, setNotionUrl] = useState("");
  const [category, setCategory] = useState("start");
  const [summary, setSummary] = useState("");
  const [author, setAuthor] = useState("KSAN");
  const [tags, setTags] = useState("");
  const [importedBlocks, setImportedBlocks] = useState<GuideBlock[] | null>(null);
  const [published, setPublished] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [guideOptions, setGuideOptions] = useState<AdminGuideOption[]>([]);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [relatedCategory, setRelatedCategory] = useState("residency");
  const previewBlocks = useMemo(() => importedBlocks ?? guide?.blocks ?? [], [guide?.blocks, importedBlocks]);
  const selectedCategory = resolveGuideCategory(category);
  const filteredRelatedGuides = useMemo(
    () => guideOptions.filter((guide) => resolveGuideCategory(guide.category).id === relatedCategory),
    [guideOptions, relatedCategory]
  );

  useEffect(() => {
    if (!status || status.includes("중입니다")) return;
    const timeout = window.setTimeout(() => setStatus(""), 1500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const request = useCallback(async (path = "", options: RequestInit = {}) => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return fetch(`/api/admin/guides${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` }
    });
  }, []);

  useEffect(() => {
    async function loadGuide() {
      try {
        const response = await request();
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        const match = (result.guides as EditableGuide[]).find((item) => item.id === params.id) ?? null;
        if (!match) throw new Error("가이드를 찾지 못했습니다.");
        setGuideOptions((result.guides as EditableGuide[]).filter((item) => item.id !== params.id));
        setGuide(match);
        setRawText(match.raw_text);
        setTitle(match.title);
        setSlug(match.slug);
        setNotionUrl(match.notion_url ?? "");
        setCategory(resolveGuideCategory(match.category).id);
        setSummary(match.summary ?? "");
        setAuthor(match.author ?? "KSAN");
        setTags(formatGuideTagsInput(match.tags ?? []));
        setImportedBlocks(match.blocks ?? null);
        setPublished(match.published);
        setRelatedIds((match.related_ids ?? []).slice(0, 3));
        setStatus("");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "가이드를 불러오지 못했습니다.");
      }
    }

    void loadGuide();
  }, [params.id, request]);

  function toggleRelatedGuide(id: string) {
    setRelatedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  async function importNotion() {
    const response = await request("/import-notion", {
      body: JSON.stringify({ url: notionUrl }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(`불러오기 실패: ${result.error}`);
      return;
    }

    setRawText(result.rawText ?? "");
    setTitle(result.title ?? "");
    setSlug(result.slug ?? "");
    setCategory(resolveGuideCategory(result.category ?? "start").id);
    setSummary(result.summary ?? "");
    setAuthor(result.author ?? "KSAN");
    setTags(formatGuideTagsInput(result.tags ?? []));
    setImportedBlocks(Array.isArray(result.blocks) ? result.blocks : null);
    setStatus("Notion 페이지를 불러왔습니다. 확인 후 저장해주세요.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!guide) return;

    const response = await request("", {
      body: JSON.stringify({
        id: guide.id,
        title,
        slug,
        summary,
        rawText,
        category,
        author,
        tags: parseGuideTags(tags).join(", "),
        notionUrl,
        blocks: importedBlocks ?? undefined,
        published,
        relatedIds
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH"
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(`저장 실패: ${result.error}`);
      return;
    }
    setStatus("가이드를 저장했습니다.");
    router.refresh();
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">정착가이드</p>
          <h1>가이드 수정</h1>
        </div>
        <div className="admin-page-actions">
          <Link className="admin-button secondary" href="/admin/guides">
            목록으로
          </Link>
        </div>
      </header>

      {guide ? (
        <section>
          <form className="admin-form" id="edit-guide-form" onSubmit={submit}>
            <label className="field">
              <span>Notion 페이지 링크</span>
              <input
                value={notionUrl}
                onChange={(event) => setNotionUrl(event.target.value)}
                placeholder="표에서 가이드 제목을 클릭한 뒤 그 페이지 링크를 붙여넣기"
              />
            </label>
            <button className="admin-button secondary" type="button" onClick={importNotion}>
              Notion에서 불러오기
            </button>
            <label className="field">
              <span>카테고리</span>
              <select onChange={(event) => setCategory(event.target.value)} value={category}>
                {guideCategories.map((item) => <option key={item.id} value={item.id}>{item.emoji} {item.title}</option>)}
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
                    <option key={category.id} value={category.id}>{category.emoji} {category.title}</option>
                  ))}
                </select>
              </label>
              {guideOptions.length ? (
                <div>
                  {filteredRelatedGuides.length ? filteredRelatedGuides.map((guide) => {
                    const checked = relatedIds.includes(guide.id);
                    const disabled = !checked && relatedIds.length >= 3;
                    const optionCategory = resolveGuideCategory(guide.category);
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
                          <small>{optionCategory.title} · {guide.published ? "공개" : "비공개"}</small>
                        </span>
                      </label>
                    );
                  }) : <span className="admin-form-note">이 카테고리에 선택할 수 있는 다른 가이드가 없습니다.</span>}
                </div>
              ) : (
                <span className="admin-form-note">아직 선택할 수 있는 다른 가이드가 없습니다.</span>
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
      ) : null}
      {previewOpen ? (
        <div className="admin-preview-modal" role="dialog" aria-modal="true" aria-label="가이드 풀스크린 미리보기">
          <button className="admin-preview-close" type="button" onClick={() => setPreviewOpen(false)}>
            <X aria-hidden size={18} /> 닫기
          </button>
          <AdminGuideWebsitePreview
            blocks={previewBlocks}
            categoryEmoji={selectedCategory.emoji}
            categoryTitle={selectedCategory.title}
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
