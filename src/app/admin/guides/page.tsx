"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { guideCategories, resolveGuideCategory } from "@/lib/guide-structure";
import { formatGuideTagsInput } from "@/lib/guideTags";

type AdminGuide = {
  author: string | null;
  blocks: unknown[] | null;
  category: string;
  id: string;
  notion_url?: string | null;
  published: boolean;
  raw_text: string | null;
  slug: string;
  summary: string | null;
  saved_count?: number;
  tags: string[] | null;
  title: string;
  updated_at: string;
};

const allCategory = {
  emoji: "•",
  id: "all",
  title: "전체"
};

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [status, setStatus] = useState("가이드를 불러오는 중입니다.");

  const request = useCallback(async (options: RequestInit = {}, query = "") => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return fetch(`/api/admin/guides${query}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` }
    });
  }, []);

  const loadGuides = useCallback(async () => {
    try {
      const response = await request();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setGuides(result.guides ?? []);
      setStatus(result.guides?.length ? "" : "등록된 가이드가 없습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "가이드를 불러오지 못했습니다.");
    }
  }, [request]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadGuides();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadGuides]);

  useEffect(() => {
    if (!status || status.includes("중입니다")) return;
    const timeout = window.setTimeout(() => setStatus(""), 1500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  const categoryTabs = useMemo(() => [allCategory, ...guideCategories], []);
  const countsByCategory = useMemo(() => {
    const counts = new Map<string, number>([["all", guides.length]]);
    for (const guide of guides) {
      const category = resolveGuideCategory(guide.category).id;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return counts;
  }, [guides]);

  const visibleGuides = useMemo(
    () =>
      activeCategory === "all"
        ? guides
        : guides.filter((guide) => resolveGuideCategory(guide.category).id === activeCategory),
    [activeCategory, guides]
  );

  const groupedGuides = useMemo(
    () =>
      categoryTabs
        .filter((category) => category.id !== "all")
        .map((category) => ({
          ...category,
          guides: visibleGuides.filter((guide) => resolveGuideCategory(guide.category).id === category.id)
        }))
        .filter((category) => category.guides.length > 0),
    [categoryTabs, visibleGuides]
  );

  async function updateGuide(guide: AdminGuide, published: boolean) {
    const nextStateLabel = published ? "공개" : "비공개";
    if (!window.confirm(`‘${guide.title}’ 가이드를 ${nextStateLabel}로 전환할까요?`)) return;

    setGuides((current) => current.map((item) => item.id === guide.id ? { ...item, published } : item));
    setStatus(`${nextStateLabel}로 변경하는 중입니다.`);
    const response = await request({
      body: JSON.stringify({ id: guide.id, published }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH"
    });
    const result = await response.json();
    if (!response.ok) {
      setGuides((current) => current.map((item) => item.id === guide.id ? { ...item, published: guide.published } : item));
      setStatus(result.error);
      return;
    }
    setStatus(`${nextStateLabel}로 변경했습니다.`);
  }

  async function removeGuide(guide: AdminGuide) {
    if (!window.confirm(`‘${guide.title}’ 가이드를 삭제할까요? 삭제 후에는 복구할 수 없습니다.`)) return;
    setStatus("가이드를 삭제하는 중입니다.");
    const response = await request({ method: "DELETE" }, `?id=${guide.id}`);
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error);
      return;
    }
    await loadGuides();
    setStatus("가이드를 삭제했습니다.");
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <h1>정착가이드 관리</h1>
        </div>
        <Link className="admin-button" href="/admin/guides/new">
          <Plus aria-hidden size={17} /> 새 가이드 작성
        </Link>
      </header>

      <section className="admin-section">
        <div className="admin-guide-toolbar">
          <strong>{guides.length}개 가이드</strong>
          <span>공개 {guides.filter((guide) => guide.published).length}개</span>
        </div>
        <div aria-label="가이드 카테고리" className="admin-filter-buttons" role="tablist">
          {categoryTabs.map((category) => (
            <button
              aria-pressed={activeCategory === category.id}
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              type="button"
            >
              <span aria-hidden>{category.emoji}</span> {category.title} <small>{countsByCategory.get(category.id) ?? 0}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="admin-guide-groups">
        {groupedGuides.length ? (
          groupedGuides.map((category) => (
            <section className="admin-guide-group" key={category.id}>
              <header className="admin-guide-group-header">
                <div>
                  <span aria-hidden>{category.emoji}</span>
                  <h2>{category.title}</h2>
                </div>
                <strong><Bookmark aria-hidden size={14} /> {category.guides.length}</strong>
              </header>
              <div className="admin-guide-list">
                {category.guides.map((guide) => {
                  const normalizedCategory = resolveGuideCategory(guide.category);
                  const tags = formatGuideTagsInput(guide.tags ?? []).split(" ").filter(Boolean);
                  return (
                    <article className="admin-guide-row" key={guide.id}>
                      <div className="admin-guide-row-main">
                        <span>{normalizedCategory.title} · {guide.published ? "공개" : "비공개"}</span>
                        <h3>
                          <Link href={`/admin/guides/${guide.id}/edit`}>
                            {guide.title}
                          </Link>
                        </h3>
                        <div className="admin-tag-list">
                          {tags.length ? tags.map((tag) => <span key={tag}>{tag}</span>) : <span>태그 없음</span>}
                        </div>
                      </div>
                      <div className="admin-guide-actions">
                        <Link href={`/admin/guides/${guide.id}/edit`}>
                          <Pencil aria-hidden size={15} /> 수정
                        </Link>
                        <button
                          className="admin-text-button"
                          onClick={() => void updateGuide(guide, !guide.published)}
                          type="button"
                        >
                          {guide.published ? <EyeOff aria-hidden size={15} /> : <Eye aria-hidden size={15} />}
                          {guide.published ? "비공개" : "공개"}
                        </button>
                        <button className="admin-text-button danger" onClick={() => void removeGuide(guide)} type="button">
                          <Trash2 aria-hidden size={15} /> 삭제
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <section className="admin-section">
            <p className="admin-note">{status || "이 카테고리에 등록된 가이드가 없습니다."}</p>
          </section>
        )}
      </section>

      {status && groupedGuides.length ? (
        <p aria-live="polite" className={`admin-toast${status.includes("중입니다") ? " is-loading" : ""}`}>
          {status}
        </p>
      ) : null}
    </main>
  );
}
