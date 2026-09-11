"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { AdminAgendaTable } from "@/components/AdminAgendaTable";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type ImageItem = {
  file?: File;
  id: string;
  name: string;
  url: string;
};

type SponsorItem = {
  file?: File;
  id: string;
  image: string;
  name: string;
};

type EditableEvent = {
  agendaText?: string;
  applicationDeadline?: string | null;
  audience?: string | null;
  description: string | null;
  id: string;
  image_url: string | null;
  image_urls: string[] | null;
  location: string | null;
  published: boolean;
  registration_target: string | null;
  source?: "database" | "default";
  sponsors: Array<{ image?: string; name: string }> | null;
  starts_at: string;
  title: string;
  organizerLogo?: string | null;
  organizerName?: string | null;
  price?: string | null;
};

function dateInputValue(value: string) {
  return value.slice(0, 10);
}

function startsAtFromDate(value: FormDataEntryValue | null) {
  return typeof value === "string" && value ? `${value}T12:00:00.000Z` : "";
}

function existingImageItems(eventItem: EditableEvent | null): ImageItem[] {
  if (!eventItem) return [];
  const urls = eventItem.image_urls?.length ? eventItem.image_urls : eventItem.image_url ? [eventItem.image_url] : [];
  return urls.map((url, index) => ({ id: url, name: `사진 ${index + 1}`, url }));
}

function existingSponsorItems(eventItem: EditableEvent | null): SponsorItem[] {
  if (!eventItem?.sponsors) return [];
  return eventItem.sponsors
    .filter((sponsor) => sponsor.image)
    .map((sponsor, index) => ({
      id: sponsor.image ?? `${sponsor.name}-${index}`,
      image: sponsor.image ?? "",
      name: sponsor.name || `후원사 ${index + 1}`
    }));
}

function moveItem<T extends { id: string }>(items: T[], draggedId: string, targetId: string) {
  if (draggedId === targetId) return items;
  const fromIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (fromIndex < 0 || targetIndex < 0) return items;
  const next = items.filter((item) => item.id !== draggedId);
  next.splice(targetIndex, 0, items[fromIndex]);
  return next;
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [eventItem, setEventItem] = useState<EditableEvent | null>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [sponsorItems, setSponsorItems] = useState<SponsorItem[]>([]);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [draggedSponsorId, setDraggedSponsorId] = useState<string | null>(null);
  const [status, setStatus] = useState("행사를 불러오는 중입니다.");

  useEffect(() => {
    if (!eventItem || !status || status.includes("중입니다")) return;
    const timeout = window.setTimeout(() => setStatus(""), 1600);
    return () => window.clearTimeout(timeout);
  }, [eventItem, status]);

  const getSession = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return data.session;
  }, []);

  useEffect(() => {
    getSession().then(async (session) => {
      const response = await fetch("/api/admin/events", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      const match = (result.events as EditableEvent[]).find((item) => item.id === id) ?? null;
      setEventItem(match);
      setImageItems(existingImageItems(match));
      setSponsorItems(existingSponsorItems(match));
      setStatus(match ? "" : "행사를 찾을 수 없습니다.");
    }).catch((error) => setStatus(error instanceof Error ? error.message : "행사를 불러오지 못했습니다."));
  }, [getSession, id]);

  function filesToImageItems(files: File[]) {
    return files.map((file) => ({
      file,
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^.]+$/, "") || "사진",
      url: URL.createObjectURL(file)
    }));
  }

  function filesToSponsorItems(files: File[]) {
    return files.map((file) => ({
      file,
      id: crypto.randomUUID(),
      image: URL.createObjectURL(file),
      name: file.name.replace(/\.[^.]+$/, "") || "후원사"
    }));
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    setImageItems((current) => [...current, ...filesToImageItems(files)]);
    event.currentTarget.value = "";
  }

  function handleSponsorChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    setSponsorItems((current) => [...current, ...filesToSponsorItems(files)]);
    event.currentTarget.value = "";
  }

  function handleDragStart(event: React.DragEvent<HTMLElement>, itemId: string, kind: "image" | "sponsor") {
    event.dataTransfer.setData("text/plain", itemId);
    event.dataTransfer.effectAllowed = "move";
    if (kind === "image") setDraggedImageId(itemId);
    if (kind === "sponsor") setDraggedSponsorId(itemId);
  }

  function handleImageDrop(event: React.DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain") || draggedImageId;
    if (!draggedId) return;
    setImageItems((current) => moveItem(current, draggedId, targetId));
    setDraggedImageId(null);
  }

  function handleSponsorDrop(event: React.DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData("text/plain") || draggedSponsorId;
    if (!draggedId) return;
    setSponsorItems((current) => moveItem(current, draggedId, targetId));
    setDraggedSponsorId(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("변경사항을 저장하는 중입니다.");
    const formData = new FormData(event.currentTarget);
    formData.set("id", id);
    formData.set("startsAt", startsAtFromDate(formData.get("startsAt")));
    formData.set("imageOrder", JSON.stringify(imageItems.map((item) => item.file
      ? { field: `photo-${item.id}`, kind: "upload" }
      : { kind: "existing", url: item.url }
    )));
    formData.set("sponsorOrder", JSON.stringify(sponsorItems.map((item) => item.file
      ? { field: `sponsor-logo-${item.id}`, kind: "upload", name: item.name }
      : { image: item.image, kind: "existing", name: item.name }
    )));
    formData.set("published", String(formData.get("published") === "on"));
    formData.delete("photos");
    formData.delete("sponsorLogos");
    imageItems.forEach((item) => {
      if (item.file) formData.append(`photo-${item.id}`, item.file);
    });
    sponsorItems.forEach((item) => {
      if (item.file) formData.append(`sponsor-logo-${item.id}`, item.file);
    });

    try {
      const session = await getSession();
      const response = await fetch("/api/admin/events", {
        body: formData,
        headers: { Authorization: `Bearer ${session.access_token}` },
        method: "PATCH"
      });
      const result = await response.json();
      setStatus(response.ok ? "변경사항을 저장했습니다. 공개 페이지에 반영됩니다." : result.error);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "저장하지 못했습니다.");
    }
  }

  if (!eventItem) {
    return <main className="page" id="main"><h1 className="page-title">행사 수정</h1><p className="status">{status}</p></main>;
  }

  const disabled = false;

  return (
    <main className="page" id="main">
      <div className="admin-page-header">
        <div><p className="admin-kicker">Events</p><h1 className="page-title">행사 수정</h1><p>{eventItem.title}</p></div>
        <Link className="admin-button secondary" href="/admin/events">목록으로</Link>
      </div>

      <form className="form" onSubmit={submit}>
        <section className="admin-form-section">
          <h2>공통 정보</h2>
          <label className="field"><span>행사명</span><input defaultValue={eventItem.title} disabled={disabled} name="title" required /></label>
          <div className="admin-two-column">
            <label className="field"><span>날짜</span><input defaultValue={dateInputValue(eventItem.starts_at)} disabled={disabled} name="startsAt" required type="date" /></label>
            <label className="field"><span>장소</span><input defaultValue={eventItem.location ?? ""} disabled={disabled} name="location" /></label>
          </div>
          <div className="admin-two-column">
            <label className="field"><span>주최자</span><input defaultValue={eventItem.organizerName ?? "KSAN"} disabled={disabled} name="organizerName" placeholder="KSAN" /></label>
            <label className="field">
              <span>주최자 로고</span>
              <select defaultValue={eventItem.organizerLogo ?? "/images/ksan-logo-black.png"} disabled={disabled} name="organizerLogo">
                <option value="/images/ksan-logo-black.png">KSAN 기본 로고</option>
                <option value="">로고 없음</option>
              </select>
            </label>
          </div>
        </section>

        <section className="admin-form-section">
          <h2>예정 행사 정보</h2>
          <div className="admin-two-column">
            <label className="field"><span>가격</span><input defaultValue={eventItem.price ?? ""} disabled={disabled} name="price" placeholder="무료 / 5유로 / 현장 안내" /></label>
            <label className="field"><span>신청 마감</span><input defaultValue={eventItem.applicationDeadline ?? ""} disabled={disabled} name="applicationDeadline" type="date" /></label>
          </div>
          <label className="field"><span>대상</span><input defaultValue={eventItem.audience ?? ""} disabled={disabled} name="audience" placeholder="KSAN 커뮤니티 / 신입생 / 참가 신청자" /></label>
          <AdminAgendaTable defaultValue={eventItem.agendaText} disabled={disabled} />
          <label className="field"><span>Google Form 신청 링크</span><input defaultValue={eventItem.registration_target ?? ""} disabled={disabled} name="registrationTarget" placeholder="https://forms.gle/..." type="url" /></label>
        </section>

        <section className="admin-form-section">
          <h2>지난 행사 기록</h2>
          <label className="field"><span>행사 소개 또는 후기</span><textarea defaultValue={eventItem.description ?? ""} disabled={disabled} name="description" rows={7} required /></label>

          <div className="field admin-about-upload-field">
          <span>행사 사진</span>
          <div className="admin-business-upload-panel">
            <div className="admin-business-upload-preview-grid">
              {imageItems.length ? imageItems.map((item, index) => (
                <div className={`admin-business-upload-item${draggedImageId === item.id ? " is-dragging" : ""}`} draggable={!disabled} key={item.id} onDragEnd={() => setDraggedImageId(null)} onDragOver={(dragEvent) => dragEvent.preventDefault()} onDragStart={(dragEvent) => handleDragStart(dragEvent, item.id, "image")} onDrop={(dragEvent) => handleImageDrop(dragEvent, item.id)}>
                  <button className="admin-business-upload-thumb" disabled={disabled} onClick={() => setActiveImageUrl(item.url)} style={{ backgroundImage: `url(${item.url})` }} type="button"><span>{index + 1}</span></button>
                  <div className="admin-business-upload-actions">
                    <button aria-label="사진 크게 보기" onClick={() => setActiveImageUrl(item.url)} type="button"><Eye aria-hidden size={15} /></button>
                    <button aria-label="사진 삭제" disabled={disabled} onClick={() => setImageItems((current) => current.filter((photo) => photo.id !== item.id))} type="button"><X aria-hidden size={15} /></button>
                  </div>
                </div>
              )) : <div className="admin-business-upload-empty">행사 사진을 여러 장 추가할 수 있어요. 첫 번째 사진이 대표 이미지로 쓰입니다.</div>}
            </div>
            <div className="admin-business-file-row"><input accept="image/*" disabled={disabled} multiple name="photos" onChange={handlePhotoChange} type="file" /></div>
          </div>
          </div>

          <div className="field admin-about-upload-field">
          <span>함께한 후원사 로고</span>
          <div className="admin-business-upload-panel">
            <div className="admin-business-upload-preview-grid">
              {sponsorItems.length ? sponsorItems.map((item, index) => (
                <div className={`admin-business-upload-item${draggedSponsorId === item.id ? " is-dragging" : ""}`} draggable={!disabled} key={item.id} onDragEnd={() => setDraggedSponsorId(null)} onDragOver={(dragEvent) => dragEvent.preventDefault()} onDragStart={(dragEvent) => handleDragStart(dragEvent, item.id, "sponsor")} onDrop={(dragEvent) => handleSponsorDrop(dragEvent, item.id)}>
                  <button className="admin-business-upload-thumb admin-event-logo-thumb" disabled={disabled} onClick={() => setActiveImageUrl(item.image)} style={{ backgroundImage: `url(${item.image})` }} type="button"><span>{index + 1}</span></button>
                  <div className="admin-business-upload-actions">
                    <button aria-label="로고 크게 보기" onClick={() => setActiveImageUrl(item.image)} type="button"><Eye aria-hidden size={15} /></button>
                    <button aria-label="로고 삭제" disabled={disabled} onClick={() => setSponsorItems((current) => current.filter((logo) => logo.id !== item.id))} type="button"><X aria-hidden size={15} /></button>
                  </div>
                </div>
              )) : <div className="admin-business-upload-empty">후원사 로고만 여러 개 올리면 지난 행사 상세에 표시됩니다.</div>}
            </div>
            <div className="admin-business-file-row"><input accept="image/*" disabled={disabled} multiple name="sponsorLogos" onChange={handleSponsorChange} type="file" /></div>
          </div>
          </div>
        </section>

        <div className="admin-publish-options"><label className="admin-check"><input defaultChecked={eventItem.published} disabled={disabled} name="published" type="checkbox" /> 공개 페이지에 게시</label></div>
        <button className="button" disabled={disabled} type="submit">변경사항 저장</button>
      </form>

      {activeImageUrl ? (
        <div className="admin-image-lightbox" role="dialog" aria-modal="true" aria-label="이미지 크게 보기">
          <button aria-label="닫기" onClick={() => setActiveImageUrl(null)} type="button"><X aria-hidden /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="선택한 이미지" src={activeImageUrl} />
        </div>
      ) : null}
      {status ? <p aria-live="polite" className={`admin-toast${status.includes("중입니다") ? " is-loading" : ""}`}>{status}</p> : null}
    </main>
  );
}
