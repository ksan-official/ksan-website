"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { AdminFormattedTextarea } from "@/components/AdminFormattedTextarea";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type ImageItem = {
  file?: File;
  id: string;
  url: string;
};

type EditablePost = {
  accent: string; apply_mode: string; apply_target: string; company: string; deadline: string | null;
  company_intro: string | null; department: string | null; description: string; employment_type: string | null; featured: boolean;
  featured_order: number; id: string; image_url: string | null; image_urls: string[] | null; location: string | null; logo_url: string | null; published: boolean; tags: string[] | null; title: string;
  requirements: string | null; responsibilities: string | null;
};

function bodyForEdit(post: EditablePost) {
  const sections = [
    post.description,
    post.company_intro ? `회사 소개\n${post.company_intro}` : "",
    post.responsibilities ? `주요 업무\n${post.responsibilities}` : "",
    post.requirements ? `자격 요건\n${post.requirements}` : ""
  ];

  return sections.map((section) => section?.trim()).filter(Boolean).join("\n\n");
}

function existingImageUrls(post: EditablePost | null) {
  if (!post) return [];
  return post.image_urls?.length ? post.image_urls : post.image_url ? [post.image_url] : [];
}

function existingImageItems(post: EditablePost | null): ImageItem[] {
  return existingImageUrls(post).map((url) => ({ id: url, url }));
}

export default function EditBusinessPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<EditablePost | null>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("공고를 불러오는 중입니다.");

  useEffect(() => {
    if (!post || !status || status.includes("중입니다")) return;
    const timeout = window.setTimeout(() => setStatus(""), 1500);
    return () => window.clearTimeout(timeout);
  }, [post, status]);

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
      setImageItems(existingImageItems(match));
      setLogoPreviewUrl(match?.logo_url ?? null);
      setStatus(match ? "" : "공고를 찾을 수 없습니다.");
    }).catch((error) => setStatus(error instanceof Error ? error.message : "공고를 불러오지 못했습니다."));
  }, [getSession, id]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    setImageItems((current) => [
      ...current,
      ...files.map((file) => ({
        file,
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file)
      }))
    ]);
    event.currentTarget.value = "";
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setLogoPreviewUrl(file ? URL.createObjectURL(file) : post?.logo_url ?? null);
  }

  function moveImage(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    setImageItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === draggedId);
      const targetIndex = current.findIndex((item) => item.id === targetId);
      if (fromIndex < 0 || targetIndex < 0) return current;
      const next = current.filter((item) => item.id !== draggedId);
      next.splice(targetIndex, 0, current[fromIndex]);
      return next;
    });
  }

  function handleDragStart(event: React.DragEvent<HTMLButtonElement>, itemId: string) {
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
    setDraggedImageId(itemId);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain") || draggedImageId;
    if (!draggedId) return;
    moveImage(draggedId, targetId);
    setDraggedImageId(null);
  }

  function removeImage(itemId: string) {
    setImageItems((current) => current.filter((item) => item.id !== itemId));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("변경사항을 저장하는 중입니다.");
    document.dispatchEvent(new Event("ksan:sync-rich-text"));
    const formData = new FormData(event.currentTarget);
    formData.set("id", id);
    formData.set("accent", "orange");
    formData.set("companyIntro", "");
    formData.set("featured", "false");
    formData.set("featuredOrder", "0");
    formData.set("imageUrl", imageItems[0]?.url ?? "");
    formData.set("imageUrls", JSON.stringify(imageItems.filter((item) => !item.file).map((item) => item.url)));
    formData.set("logoUrl", post?.logo_url ?? "");
    formData.set("imageOrder", JSON.stringify(imageItems.map((item) => item.file
      ? { field: `photo-${item.id}`, kind: "upload" }
      : { kind: "existing", url: item.url }
    )));
    formData.delete("photos");
    imageItems.forEach((item) => {
      if (item.file) formData.append(`photo-${item.id}`, item.file);
    });
    formData.set("published", String(formData.get("published") === "on"));
    formData.set("requirements", "");
    formData.set("responsibilities", "");
    try {
      const session = await getSession();
      const response = await fetch("/api/admin/business", {
        body: formData,
        headers: { Authorization: `Bearer ${session.access_token}` }, method: "PATCH"
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
          <label className="field"><span>공고 제목</span><input defaultValue={post.title} name="title" required /></label>
          <label className="field"><span>기업명</span><input defaultValue={post.company} name="company" required /></label>
          <label className="field admin-business-logo-field">
            <span>기업 로고</span>
            <div className="admin-business-logo-upload">
              <div
                className="admin-business-logo-preview"
                style={logoPreviewUrl ? { backgroundImage: `url(${logoPreviewUrl})` } : undefined}
              >
                {logoPreviewUrl ? null : "Logo"}
              </div>
              <input accept="image/*" name="logo" onChange={handleLogoChange} type="file" />
            </div>
          </label>
          <label className="field"><span>분야/직군</span><input defaultValue={post.department ?? ""} name="department" /></label>
          <label className="field"><span>근무 지역</span><input defaultValue={post.location ?? ""} name="location" placeholder="비어 있으면 공고 확인으로 표시됩니다." /></label>
          <label className="field"><span>고용 형태</span><select defaultValue={post.employment_type ?? "공고 확인"} name="employmentType"><option>공고 확인</option><option>풀타임</option><option>워킹 스튜던트</option><option>파트타임</option><option>인턴</option><option>계약직</option></select></label>
          <label className="field"><span>마감일</span><input defaultValue={post.deadline ?? ""} name="deadline" type="date" /></label>
        </div>
        <label className="field">
          <span>공고 본문</span>
          <AdminFormattedTextarea defaultValue={bodyForEdit(post)} name="description" required rows={14} />
        </label>
        <label className="field admin-about-upload-field">
          <span>공고 이미지</span>
          <div className="admin-business-upload-panel">
            <div className="admin-business-upload-preview-grid">
              {imageItems.length ? imageItems.map((item, index) => (
                <div
                  className={`admin-business-upload-item${draggedImageId === item.id ? " is-dragging" : ""}`}
                  key={item.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, item.id)}
                >
                  <button
                    className="admin-business-upload-thumb"
                    draggable
                    onDragEnd={() => setDraggedImageId(null)}
                    onDragStart={(event) => handleDragStart(event, item.id)}
                    onClick={() => setActiveImageUrl(item.url)}
                    style={{ backgroundImage: `url(${item.url})` }}
                    type="button"
                  >
                    <span>{index + 1}</span>
                  </button>
                  <div className="admin-business-upload-actions">
                    <button aria-label="이미지 크게 보기" onClick={() => setActiveImageUrl(item.url)} type="button"><Eye aria-hidden size={15} /></button>
                    <button aria-label="이미지 삭제" onClick={() => removeImage(item.id)} type="button"><X aria-hidden size={15} /></button>
                  </div>
                </div>
              )) : (
                <div className="admin-business-upload-empty">이미지를 추가하면 순서를 정할 수 있어요.</div>
              )}
            </div>
            <div className="admin-business-file-row">
              <input accept="image/*" multiple name="photos" onChange={handlePhotoChange} type="file" />
            </div>
          </div>
        </label>
        <div className="admin-two-column">
          <label className="field"><span>지원 방식</span><select defaultValue={post.apply_mode} name="applyMode"><option value="email">이메일</option><option value="external_link">외부 링크</option><option value="internal_form">내부 지원 폼</option></select></label>
          <label className="field"><span>지원 이메일 또는 링크</span><input defaultValue={post.apply_target} name="applyTarget" required /></label>
        </div>
        <div className="admin-publish-options">
          <label className="admin-check"><input defaultChecked={post.published} name="published" type="checkbox" /> 공개 페이지에 게시</label>
        </div>
        <button className="button" type="submit">변경사항 저장</button>
      </form>
      {activeImageUrl ? (
        <div className="admin-image-lightbox" role="dialog" aria-modal="true" aria-label="공고 이미지 크게 보기">
          <button aria-label="닫기" onClick={() => setActiveImageUrl(null)} type="button"><X aria-hidden /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="선택한 공고 이미지" src={activeImageUrl} />
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
