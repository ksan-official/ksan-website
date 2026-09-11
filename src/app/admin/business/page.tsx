"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AdminBusinessPost = {
  company: string;
  created_at: string;
  employment_type: string | null;
  id: string;
  location: string | null;
  published: boolean;
  saved_count?: number;
  title: string;
};

export default function AdminBusinessPage() {
  const [posts, setPosts] = useState<AdminBusinessPost[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
      setSelectedIds((current) => current.filter((id) => result.posts.some((post: AdminBusinessPost) => post.id === id)));
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

  async function updatePost(post: AdminBusinessPost, published: boolean) {
    const nextStateLabel = published ? "공개" : "비공개";
    if (!window.confirm(`‘${post.title}’ 공고를 ${nextStateLabel}로 전환할까요?`)) return;

    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, published } : item));
    setStatus(`${nextStateLabel}로 변경하는 중입니다.`);
    const response = await request("", {
      body: JSON.stringify({ id: post.id, published }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH"
    });
    const result = await response.json();
    if (!response.ok) {
      setPosts((current) => current.map((item) => item.id === post.id ? { ...item, published: post.published } : item));
      setStatus(result.error);
      return;
    }
    setStatus(`${nextStateLabel}로 변경했습니다.`);
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

  async function removeSelectedPosts() {
    if (!selectedIds.length) return;
    if (!window.confirm(`선택한 공고 ${selectedIds.length}개를 삭제할까요? 삭제 후에는 복구할 수 없습니다.`)) return;
    setStatus("선택한 공고를 삭제하는 중입니다.");
    const response = await request("", {
      body: JSON.stringify({ ids: selectedIds }),
      headers: { "Content-Type": "application/json" },
      method: "DELETE"
    });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error);
      return;
    }
    setSelectedIds([]);
    await loadPosts();
  }

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((current) => checked ? [...current, id] : current.filter((selectedId) => selectedId !== id));
  }

  function toggleAllSelected(checked: boolean) {
    setSelectedIds(checked ? posts.map((post) => post.id) : []);
  }

  const allSelected = posts.length > 0 && selectedIds.length === posts.length;

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div><p className="admin-kicker">Business Hub</p><h1>채용 공고 관리</h1></div>
        <Link className="admin-button" href="/admin/business/new">새 공고 등록</Link>
      </header>
      <section className="admin-section">
        <div className="admin-business-list-header">
          <label className="admin-bulk-select">
            <input checked={allSelected} disabled={!posts.length} onChange={(event) => toggleAllSelected(event.target.checked)} type="checkbox" />
            <strong>{posts.length}개 공고</strong>
          </label>
          <button className="admin-button danger" disabled={!selectedIds.length} onClick={() => void removeSelectedPosts()} type="button">
            선택 삭제{selectedIds.length ? ` ${selectedIds.length}` : ""}
          </button>
        </div>
        <div className="admin-business-list">
          {posts.map((post) => (
            <article className="admin-business-row" key={post.id}>
              <label className="admin-row-checkbox" aria-label={`${post.title} 선택`}>
                <input checked={selectedIds.includes(post.id)} onChange={(event) => toggleSelected(post.id, event.target.checked)} type="checkbox" />
              </label>
              <div className="admin-business-row-main">
                <span>{post.company}</span><h2>{post.title}</h2>
                <div className="admin-tag-list">
                  <span>{post.employment_type ?? "공고 확인"}</span><span>{post.location ?? "공고 확인"}</span>
                </div>
              </div>
              <div className="admin-guide-actions admin-business-state">
                <span className="admin-save-count"><Bookmark aria-hidden size={15} /> {post.saved_count ?? 0}</span>
                <Link href={`/admin/business/${post.id}/edit`}><Pencil aria-hidden size={18} />수정</Link>
                <button className="admin-text-button" onClick={() => void updatePost(post, !post.published)} type="button">
                  {post.published ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
                  {post.published ? "비공개" : "공개"}
                </button>
                <button className="admin-text-button danger" onClick={() => void removePost(post)} type="button"><Trash2 aria-hidden size={18} />삭제</button>
              </div>
            </article>
          ))}
        </div>
        {status ? <p className="admin-note">{status}</p> : null}
      </section>
    </main>
  );
}
