"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AdminGuide = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  author: string | null;
  tags: string[] | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [status, setStatus] = useState("가이드를 불러오는 중입니다.");

  const request = useCallback(async (path = "", options: RequestInit = {}) => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return fetch(`/api/admin/guides${path}`, {
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
      setStatus((result.guides ?? []).length ? "" : "등록된 가이드가 없습니다.");
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

  async function updateGuide(id: string, patch: Partial<Pick<AdminGuide, "published">>) {
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
    await loadGuides();
  }

  async function removeGuide(guide: AdminGuide) {
    if (!window.confirm(`‘${guide.title}’ 가이드를 삭제할까요? 삭제 후에는 복구할 수 없습니다.`)) return;
    setStatus("가이드를 삭제하는 중입니다.");
    const response = await request(`?id=${guide.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error);
      return;
    }
    await loadGuides();
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">정착가이드</p>
          <h1>정착가이드 관리</h1>
          <p>가이드를 추가·수정하고 공개 상태를 관리합니다.</p>
        </div>
        <Link className="admin-button" href="/admin/guides/new">
          새 가이드 추가
        </Link>
      </header>

      <section className="admin-section">
        <div className="admin-business-list-header">
          <strong>{guides.length}개 가이드</strong>
          <span>공개 {guides.filter((guide) => guide.published).length}개</span>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>카테고리</th>
              <th>작성자</th>
              <th>수정일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {guides.map((guide) => (
              <tr key={guide.id}>
                <th>
                  <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                  <p className="admin-note">{guide.summary ?? ""}</p>
                </th>
                <td>{guide.category}</td>
                <td>{guide.author ?? "KSAN"}</td>
                <td>{new Date(guide.updated_at).toLocaleDateString("ko-KR")}</td>
                <td>
                  <div className="admin-inline-actions">
                    <Link href={`/admin/guides/${guide.id}/edit`}>수정</Link>
                    <label>
                      <input
                        checked={guide.published}
                        onChange={(event) => void updateGuide(guide.id, { published: event.target.checked })}
                        type="checkbox"
                      />{" "}
                      공개
                    </label>
                    <button className="admin-text-button danger" onClick={() => void removeGuide(guide)} type="button">
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!guides.length ? (
              <tr>
                <td colSpan={5}>등록된 가이드가 없습니다.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {status ? <p className="admin-note">{status}</p> : null}
      </section>
    </main>
  );
}
