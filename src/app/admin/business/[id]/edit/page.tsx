"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type EditablePost = {
  accent: string; apply_mode: string; apply_target: string; company: string; deadline: string | null;
  company_intro: string | null; department: string | null; description: string; employment_type: string | null; featured: boolean;
  featured_order: number; id: string; location: string | null; published: boolean; tags: string[] | null; title: string;
  requirements: string | null; responsibilities: string | null;
};

export default function EditBusinessPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<EditablePost | null>(null);
  const [status, setStatus] = useState("공고를 불러오는 중입니다.");

  const getSession = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return data.session;
  }, []);

  useEffect(() => {
    getSession().then(async (session) => {
      const response = await fetch("/api/admin/business", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const match = (result.posts as EditablePost[]).find((item) => item.id === id) ?? null;
      setPost(match);
      setStatus(match ? "" : "공고를 찾을 수 없습니다.");
    }).catch((error) => setStatus(error instanceof Error ? error.message : "공고를 불러오지 못했습니다."));
  }, [getSession, id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("변경사항을 저장하는 중입니다.");
    const formData = new FormData(event.currentTarget);
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/business", {
        body: JSON.stringify({
          accent: formData.get("accent"), applyMode: formData.get("applyMode"), applyTarget: formData.get("applyTarget"),
          company: formData.get("company"), companyIntro: formData.get("companyIntro"), deadline: formData.get("deadline"), department: formData.get("department"),
          description: formData.get("description"), employmentType: formData.get("employmentType"), featured: formData.get("featured") === "on",
          featuredOrder: formData.get("featuredOrder"), id, location: formData.get("location"), published: formData.get("published") === "on",
          requirements: formData.get("requirements"), responsibilities: formData.get("responsibilities"),
          tags: String(formData.get("tags") ?? "").split(","), title: formData.get("title")
        }),
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, method: "PATCH"
      });
      const result = await response.json();
      setStatus(response.ok ? "변경사항을 저장했습니다." : result.error);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "저장하지 못했습니다.");
    }
  }

  if (!post) return <main className="page" id="main"><h1 className="page-title">공고 수정</h1><p className="status">{status}</p></main>;

  return (
    <main className="page" id="main">
      <div className="admin-page-header"><div><p className="admin-kicker">Business Hub</p><h1 className="page-title">공고 수정</h1><p>{post.company} · {post.title}</p></div><Link className="admin-button secondary" href="/admin/business">목록으로</Link></div>
      <form className="form" onSubmit={submit}>
        <div className="admin-two-column">
          <label className="field"><span>직무명</span><input defaultValue={post.title} name="title" required /></label>
          <label className="field"><span>기업명</span><input defaultValue={post.company} name="company" required /></label>
          <label className="field"><span>직무 분야</span><input defaultValue={post.department ?? ""} name="department" required /></label>
          <label className="field"><span>지역</span><input defaultValue={post.location ?? ""} name="location" required /></label>
          <label className="field"><span>고용 형태</span><select defaultValue={post.employment_type ?? "인턴"} name="employmentType"><option>풀타임</option><option>워킹 스튜던트</option><option>파트타임</option><option>인턴</option><option>계약직</option></select></label>
          <label className="field"><span>마감일</span><input defaultValue={post.deadline ?? ""} name="deadline" type="date" /></label>
        </div>
        <label className="field"><span>공고 요약</span><textarea defaultValue={post.description} name="description" required rows={3} /></label>
        <label className="field"><span>검색 태그</span><input defaultValue={(post.tags ?? []).join(", ")} name="tags" /></label>
        <section className="admin-form-section">
          <div>
            <p className="admin-kicker">Detail Sections</p>
            <h2>상세 페이지 구성</h2>
          </div>
          <label className="field"><span>회사 소개</span><textarea defaultValue={post.company_intro ?? ""} name="companyIntro" rows={4} /></label>
          <label className="field"><span>주요 업무</span><textarea defaultValue={post.responsibilities ?? ""} name="responsibilities" rows={6} /></label>
          <label className="field"><span>자격 요건</span><textarea defaultValue={post.requirements ?? ""} name="requirements" rows={6} /></label>
        </section>
        <div className="admin-two-column">
          <label className="field"><span>지원 방식</span><select defaultValue={post.apply_mode} name="applyMode"><option value="email">이메일</option><option value="external_link">외부 링크</option><option value="internal_form">내부 지원 폼</option></select></label>
          <label className="field"><span>지원 이메일 또는 링크</span><input defaultValue={post.apply_target} name="applyTarget" required /></label>
        </div>
        <div className="admin-two-column">
          <label className="field"><span>배너 컬러</span><select defaultValue={post.accent} name="accent"><option value="orange">Dutch Orange</option><option value="blue">Ice Blue</option><option value="dark">Slate Obsidian</option></select></label>
          <label className="field"><span>배너 순서</span><input defaultValue={post.featured_order} min="0" name="featuredOrder" type="number" /></label>
        </div>
        <div className="admin-publish-options">
          <label className="admin-check"><input defaultChecked={post.published} name="published" type="checkbox" /> 공개 페이지에 게시</label>
          <label className="admin-check"><input defaultChecked={post.featured} name="featured" type="checkbox" /> 하이라이트 배너로 노출</label>
        </div>
        <button className="button" type="submit">변경사항 저장</button>
      </form>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
