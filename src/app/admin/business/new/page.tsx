"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { AdminFormattedTextarea } from "@/components/AdminFormattedTextarea";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type ImageItem = {
  file: File;
  id: string;
  url: string;
};

export default function NewBusinessPostPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!status || status.includes("중입니다")) return;
    const timeout = window.setTimeout(() => setStatus(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [status]);

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
    setLogoPreviewUrl(file ? URL.createObjectURL(file) : null);
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

  function removeImage(id: string) {
    setImageItems((current) => current.filter((item) => item.id !== id));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("저장 중입니다.");
    const form = event.currentTarget;
    document.dispatchEvent(new Event("ksan:sync-rich-text"));
    const formData = new FormData(form);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("저장 실패: 관리자 계정으로 먼저 로그인해야 합니다.");
        return;
      }
      formData.set("accent", "orange");
      formData.set("companyIntro", "");
      formData.set("featured", "false");
      formData.set("featuredOrder", "0");
      formData.set("imageUrls", "[]");
      formData.set("logoUrl", "");
      formData.set("imageOrder", JSON.stringify(imageItems.map((item) => ({ field: `photo-${item.id}`, kind: "upload" }))));
      formData.delete("photos");
      imageItems.forEach((item) => formData.append(`photo-${item.id}`, item.file));
      formData.set("published", String(formData.get("published") === "on"));
      formData.set("requirements", "");
      formData.set("responsibilities", "");

      const response = await fetch("/api/admin/business", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        },
        body: formData
      });
      const result = await response.json();
      setStatus(response.ok ? "공고가 저장되었습니다. 공개 페이지에 반영됩니다." : `저장 실패: ${result.error}`);
      if (response.ok) {
        form.reset();
        setImageItems([]);
        setLogoPreviewUrl(null);
      }
    } catch (error) {
      setStatus(`저장 실패: ${error instanceof Error ? error.message : "Supabase 설정을 확인해주세요."}`);
    }
  }

  return (
    <main className="page" id="main">
      <div className="admin-page-header">
        <div><p className="admin-kicker">Business Hub</p><h1 className="page-title">채용 공고 등록</h1></div>
        <Link className="admin-button secondary" href="/admin/business">전체 공고 관리</Link>
      </div>
      <form className="form" onSubmit={submit}>
        <div className="admin-two-column">
          <label className="field"><span>공고 제목</span><input name="title" placeholder="예: 2026년 하반기 신입사원 채용" required /></label>
          <label className="field"><span>기업명</span><input name="company" required /></label>
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
          <label className="field"><span>분야/직군</span><input name="department" placeholder="예: 마케팅 / 운영 / 경영지원" /></label>
          <label className="field"><span>근무 지역</span><input name="location" placeholder="비어 있으면 공고 확인으로 표시됩니다." /></label>
          <label className="field">
            <span>고용 형태</span>
            <select defaultValue="공고 확인" name="employmentType">
              <option>공고 확인</option><option>풀타임</option><option>워킹 스튜던트</option><option>파트타임</option><option>인턴</option><option>계약직</option>
            </select>
          </label>
          <label className="field"><span>마감일</span><input name="deadline" type="date" /></label>
        </div>
        <label className="field">
          <span>공고 본문</span>
          <AdminFormattedTextarea
            name="description"
            required
            rows={14}
          />
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
          <label className="field">
            <span>지원 방식</span>
            <select name="applyMode" defaultValue="email">
              <option value="email">이메일</option><option value="external_link">외부 링크</option><option value="internal_form">내부 지원 폼</option>
            </select>
          </label>
          <label className="field"><span>지원 이메일 또는 링크</span><input name="applyTarget" required /></label>
        </div>
        <div className="admin-publish-options">
          <label className="admin-check"><input name="published" type="checkbox" /> 공개 페이지에 게시</label>
        </div>
        <button className="button" type="submit">공고 저장</button>
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
