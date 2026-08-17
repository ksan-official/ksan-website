"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AdminBusinessPost = {
  company: string;
  created_at: string;
  employment_type: string | null;
  featured: boolean;
  featured_order: number;
  id: string;
  location: string | null;
  published: boolean;
  tags: string[] | null;
  title: string;
};

type PostDraft = { featuredOrder: string; tags: string };

export default function AdminBusinessPage() {
  const [posts, setPosts] = useState<AdminBusinessPost[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PostDraft>>({});
  const [status, setStatus] = useState("공고를 불러오는 중입니다.");

  const request = useCallback(async (path = "", options: RequestInit = {}) => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return fetch(`/api/admin/business${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` }
    });
  }, []);

  const loadPosts = useCallback(async () => {
    try {
      const response = await request();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setPosts(result.posts);
      setDrafts(Object.fromEntries(result.posts.map((post: AdminBusinessPost) => [post.id, {
        featuredOrder: String(post.featured_order ?? 0),
        tags: (post.tags ?? []).join(", ")
      }])));
      setStatus(result.posts.length ? "" : "등록된 공고가 없습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "공고를 불러오지 못했습니다.");
    }
  }, [request]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPosts();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadPosts]);

  async function updatePost(id: string, patch: Partial<Pick<AdminBusinessPost, "featured" | "published">>) {
    setStatus("변경사항을 저장하는 중입니다.");
    const response = await request("", {
      body: JSON.stringify({ id, ...patch }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH"
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error);
      return;
    }
    await loadPosts();
  }

  async function saveMetadata(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    setStatus("태그와 배너 순서를 저장하는 중입니다.");
    const response = await request("", {
      body: JSON.stringify({
        featuredOrder: Number(draft.featuredOrder) || 0,
        id,
        tags: draft.tags.split(",")
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH"
    });
    const result = await response.json();
    setStatus(response.ok ? "태그와 배너 순서를 저장했습니다." : result.error);
  }

  async function removePost(post: AdminBusinessPost) {
    if (!window.confirm(`‘${post.title}’ 공고를 삭제할까요? 삭제 후에는 복구할 수 없습니다.`)) return;
    setStatus("공고를 삭제하는 중입니다.");
    const response = await request(`?id=${post.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error);
      return;
    }
    await loadPosts();
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div><p className="admin-kicker">Business Hub</p><h1>채용 공고 관리</h1><p>일반 공고와 상단 하이라이트 배너를 같은 데이터에서 관리합니다.</p></div>
        <Link className="admin-button" href="/admin/business/new">새 공고 등록</Link>
      </header>
      <section className="admin-section">
        <div className="admin-business-list-header"><strong>{posts.length}개 공고</strong><span>하이라이트 {posts.filter((post) => post.featured).length} / 3</span></div>
        <div className="admin-business-list">
          {posts.map((post) => (
            <article className="admin-business-row" key={post.id}>
              <div className="admin-business-row-main">
                <span>{post.company}</span><h2>{post.title}</h2>
                <div className="admin-tag-list">
                  <span>{post.employment_type ?? "형태 미정"}</span><span>{post.location ?? "지역 미정"}</span>
                  {(post.tags ?? []).map((tag) => <span key={tag}>#{tag}</span>)}
                </div>
                <div className="admin-business-meta-edit">
                  <label><span>태그</span><input aria-label={`${post.title} 태그`} onChange={(event) => setDrafts((current) => ({ ...current, [post.id]: { ...current[post.id], tags: event.target.value } }))} value={drafts[post.id]?.tags ?? ""} /></label>
                  <label><span>배너 순서</span><input aria-label={`${post.title} 배너 순서`} min="0" onChange={(event) => setDrafts((current) => ({ ...current, [post.id]: { ...current[post.id], featuredOrder: event.target.value } }))} type="number" value={drafts[post.id]?.featuredOrder ?? "0"} /></label>
                  <button className="admin-text-button" onClick={() => void saveMetadata(post.id)} type="button">저장</button>
                </div>
              </div>
              <div className="admin-business-state">
                <Link href={`/admin/business/${post.id}/edit`}>수정</Link>
                <label><input checked={post.published} onChange={(event) => void updatePost(post.id, { published: event.target.checked })} type="checkbox" /> 공개</label>
                <label><input checked={post.featured} onChange={(event) => void updatePost(post.id, { featured: event.target.checked })} type="checkbox" /> 배너</label>
                <button className="admin-text-button danger" onClick={() => void removePost(post)} type="button">삭제</button>
              </div>
            </article>
          ))}
        </div>
        {status ? <p className="admin-note">{status}</p> : null}
      </section>
    </main>
  );
}
