"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AboutEntry = {
  benefits: string | null;
  body: string | null;
  cta_url: string | null;
  created_at: string;
  entry_type: "executive" | "president" | "team_member" | "sponsor";
  id: string;
  image_url: string | null;
  published: boolean;
  sort_order: number;
  sponsor_kind: "sponsor" | "partner" | null;
  subtitle: string | null;
  title: string;
  updated_at: string;
  usage_guide: string | null;
};

type TeamOption = {
  entryType: AboutEntry["entry_type"];
  label: string;
  value: string;
};
type AdminMode = "team" | "sponsor";

const teamOptions: TeamOption[] = [
  { entryType: "president", label: "회장단", value: "president" },
  { entryType: "team_member", label: "기획총괄팀", value: "planning" },
  { entryType: "team_member", label: "마케팅팀", value: "marketing" },
  { entryType: "team_member", label: "재무행정팀", value: "finance" },
  { entryType: "executive", label: "기타 운영진", value: "executive" }
];
const sponsorOption: TeamOption = { entryType: "sponsor", label: "후원사", value: "sponsor" };

const emptyForm = {
  benefits: "",
  ctaUrl: "",
  generation: "",
  imageUrl: "",
  published: true,
  roleTitle: "",
  sortOrder: "0",
  sponsorKind: "sponsor",
  team: "president",
  title: "",
  usageGuide: ""
};

function formForMode(adminMode: AdminMode) {
  return adminMode === "sponsor" ? { ...emptyForm, team: "sponsor" } : emptyForm;
}

function teamFromEntry(entry: AboutEntry) {
  if (entry.entry_type === "president") return "president";
  if (entry.entry_type === "executive") return "executive";
  if (entry.entry_type === "sponsor") return "sponsor";
  if (entry.subtitle?.includes("마케팅팀")) return "marketing";
  if (entry.subtitle?.includes("재무행정팀")) return "finance";
  return "planning";
}

function generationFromSubtitle(subtitle: string | null) {
  return subtitle?.match(/(\d+)\s*기/)?.[1] ?? "";
}

function subtitleFor(team: string, generation: string) {
  const option = teamOptions.find((item) => item.value === team) ?? teamOptions[0];
  return generation.trim() ? `${option.label} / ${generation.trim()}기` : option.label;
}

function sponsorKindLabel(kind: string | null) {
  return kind === "partner" ? "제휴 파트너" : "후원사";
}

export default function NewAboutEntryPage() {
  return (
    <Suspense fallback={<AboutEntryManager adminMode="team" />}>
      <NewAboutEntryPageContent />
    </Suspense>
  );
}

function NewAboutEntryPageContent() {
  const searchParams = useSearchParams();
  const adminMode: AdminMode = searchParams.get("type") === "sponsor" ? "sponsor" : "team";

  return <AboutEntryManager adminMode={adminMode} key={adminMode} />;
}

function AboutEntryManager({ adminMode }: { adminMode: AdminMode }) {
  const [entries, setEntries] = useState<AboutEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(() => formForMode(adminMode));
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const editingEntry = useMemo(
    () => entries.find((entry) => entry.id === editingId) ?? null,
    [editingId, entries]
  );
  const isSponsor = adminMode === "sponsor";
  const shownEntries = useMemo(
    () => entries.filter((entry) => (isSponsor ? entry.entry_type === "sponsor" : entry.entry_type !== "sponsor")),
    [entries, isSponsor]
  );
  const sponsorEntries = useMemo(
    () => shownEntries.filter((entry) => (entry.sponsor_kind ?? "sponsor") === "sponsor"),
    [shownEntries]
  );
  const partnerEntries = useMemo(
    () => shownEntries.filter((entry) => entry.sponsor_kind === "partner"),
    [shownEntries]
  );

  async function loadEntries() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatus("관리자 계정으로 먼저 로그인해야 합니다.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/admin/about", {
      headers: { Authorization: `Bearer ${data.session.access_token}` }
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(`목록 불러오기 실패: ${result.error}`);
      setLoading(false);
      return;
    }

    setEntries(result.entries ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (!data.session) {
        setStatus("관리자 계정으로 먼저 로그인해야 합니다.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/about", {
        headers: { Authorization: `Bearer ${data.session.access_token}` }
      });
      const result = await response.json();

      if (!active) return;
      if (!response.ok) {
        setStatus(`목록 불러오기 실패: ${result.error}`);
        setLoading(false);
        return;
      }

      setEntries(result.entries ?? []);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updateField(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    const team = isSponsor ? "sponsor" : "president";
    setEditingId(null);
    setForm({ ...emptyForm, team });
    setPreviewUrl("");
  }

  function edit(entry: AboutEntry) {
    setEditingId(entry.id);
    setForm({
      benefits: entry.benefits ?? "",
      ctaUrl: entry.cta_url ?? "",
      generation: generationFromSubtitle(entry.subtitle),
      imageUrl: entry.image_url ?? "",
      published: entry.published,
      roleTitle: entry.body ?? "",
      sortOrder: String(entry.sort_order ?? 0),
      sponsorKind: entry.sponsor_kind ?? "sponsor",
      team: teamFromEntry(entry),
      title: entry.title,
      usageGuide: entry.usage_guide ?? ""
    });
    setPreviewUrl(entry.image_url ?? "");
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  async function authHeader() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해야 합니다.");
    return {
      Authorization: `Bearer ${data.session.access_token}`
    };
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(form.imageUrl);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatus("이미지 파일만 업로드할 수 있어요.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return objectUrl;
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    try {
      const option = isSponsor ? sponsorOption : teamOptions.find((item) => item.value === form.team) ?? teamOptions[0];
      const formData = new FormData(event.currentTarget);
      const photoInput = event.currentTarget.elements.namedItem("photo") as HTMLInputElement | null;
      formData.set("benefits", form.benefits);
      formData.set("body", form.roleTitle);
      formData.set("ctaUrl", form.ctaUrl);
      formData.set("entryType", option.entryType);
      formData.set("id", editingId ?? "");
      formData.set("imageUrl", form.imageUrl);
      formData.set("published", String(form.published));
      formData.set("sortOrder", form.sortOrder);
      formData.set("sponsorKind", form.sponsorKind);
      formData.set("subtitle", isSponsor ? sponsorKindLabel(form.sponsorKind) : subtitleFor(form.team, form.generation));
      formData.set("title", form.title);
      formData.set("usageGuide", form.usageGuide);
      if (photoInput?.files?.[0]) formData.set("photo", photoInput.files[0]);

      const response = await fetch("/api/admin/about", {
        method: editingId ? "PATCH" : "POST",
        headers: await authHeader(),
        body: formData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setStatus(editingId ? "소개 항목이 수정되었습니다." : "소개 항목이 추가되었습니다.");
      resetForm();
      await loadEntries();
    } catch (error) {
      setStatus(`저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    }
  }

  async function remove(entry: AboutEntry) {
    setStatus(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해야 합니다.");

      const response = await fetch(`/api/admin/about?id=${entry.id}`, {
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      if (editingId === entry.id) resetForm();
      setStatus("항목이 삭제되었습니다.");
      await loadEntries();
    } catch (error) {
      setStatus(`삭제 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    }
  }

  return (
    <main className="page admin-about-page" id="main">
      <p className="admin-kicker">Admin / About</p>
      <h1 className="page-title">{isSponsor ? "후원사 관리" : "소개 항목 관리"}</h1>
      <p className="lead">
        {isSponsor
          ? "후원사를 등록하면 후원사 소개 페이지의 가로 슬라이드와 상세 혜택 영역에 바로 표시됩니다."
          : "운영진을 등록하면 KSAN 소개 페이지에 사진, 이름, 기수 정보가 표시됩니다."}
      </p>

      <section className="admin-form-section">
        <h2>{editingEntry ? "항목 수정" : isSponsor ? "후원사 추가" : "운영진 추가"}</h2>
        <form className="admin-form admin-about-form" onSubmit={submit}>
          {isSponsor ? null : (
            <label className="field">
              <span>소속 팀</span>
              <select name="team" onChange={(event) => updateField("team", event.target.value)} value={form.team}>
                {teamOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            <span>{isSponsor ? "후원사명" : "이름"}</span>
            <input
              name="title"
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={isSponsor ? "예: Samsung Electronics Benelux" : "예: 홍길동"}
              required
              value={form.title}
            />
          </label>
          {isSponsor ? null : (
            <label className="field">
              <span>기수번호</span>
              <input
                inputMode="numeric"
                name="generation"
                onChange={(event) => updateField("generation", event.target.value)}
                placeholder="예: 3"
                value={form.generation}
              />
            </label>
          )}
          {isSponsor ? (
            <fieldset className="admin-sponsor-kind-field">
              <legend>후원 구분</legend>
              <button
                aria-pressed={form.sponsorKind === "sponsor"}
                onClick={() => updateField("sponsorKind", "sponsor")}
                type="button"
              >
                <strong>일반 후원사</strong>
                <span>로고와 간단한 소개만 등록합니다.</span>
              </button>
              <button
                aria-pressed={form.sponsorKind === "partner"}
                onClick={() => updateField("sponsorKind", "partner")}
                type="button"
              >
                <strong>제휴 파트너</strong>
                <span>회원 혜택, 이용 방법, 연결 링크까지 등록합니다.</span>
              </button>
            </fieldset>
          ) : null}
          <label className="field">
            <span>{isSponsor ? "소개" : "직책"}</span>
            {isSponsor ? (
              <textarea
                name="roleTitle"
                onChange={(event) => updateField("roleTitle", event.target.value)}
                placeholder="후원사 또는 제휴 파트너를 짧게 소개해주세요."
                rows={4}
                value={form.roleTitle}
              />
            ) : (
              <input
                name="roleTitle"
                onChange={(event) => updateField("roleTitle", event.target.value)}
                placeholder="예: 회장 / 팀장 / 팀원"
                value={form.roleTitle}
              />
            )}
          </label>
          {isSponsor && form.sponsorKind === "partner" ? (
            <>
              <label className="field">
                <span>제휴 혜택</span>
                <textarea
                  name="benefits"
                  onChange={(event) => updateField("benefits", event.target.value)}
                  placeholder={"한 줄에 하나씩 적어주세요.\n예: KSAN 회원 10% 할인\n예: 가입비 면제"}
                  rows={5}
                  value={form.benefits}
                />
              </label>
              <label className="field">
                <span>이용 방법</span>
                <textarea
                  name="usageGuide"
                  onChange={(event) => updateField("usageGuide", event.target.value)}
                  placeholder="예: KSAN 회원 인증 후 파트너 페이지에서 신청"
                  rows={4}
                  value={form.usageGuide}
                />
              </label>
              <label className="field">
                <span>서비스 링크</span>
                <input
                  name="ctaUrl"
                  onChange={(event) => updateField("ctaUrl", event.target.value)}
                  placeholder="https://..."
                  type="url"
                  value={form.ctaUrl}
                />
              </label>
            </>
          ) : null}
          {isSponsor && form.sponsorKind === "sponsor" ? (
            <label className="field">
              <span>회사 웹사이트</span>
              <input
                name="ctaUrl"
                onChange={(event) => updateField("ctaUrl", event.target.value)}
                placeholder="https://..."
                type="url"
                value={form.ctaUrl}
              />
            </label>
          ) : null}
          <label className="field admin-about-upload-field">
            <span>{isSponsor ? "로고 또는 대표 이미지" : "소개 사진"}</span>
            <div className="admin-about-upload-box">
              <div
                className="admin-about-upload-preview"
                style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
              >
                {previewUrl ? null : isSponsor ? "Logo" : "Photo"}
              </div>
              <div>
                <strong>{isSponsor ? "후원사 이미지 업로드" : "사람 사진 업로드"}</strong>
                <p>URL을 붙이지 말고 컴퓨터에서 바로 이미지를 선택해 주세요.</p>
                <input accept="image/*" name="photo" onChange={handlePhotoChange} type="file" />
              </div>
            </div>
          </label>
          <label className="field">
            <span>정렬 순서</span>
            <input
              inputMode="numeric"
              name="sortOrder"
              onChange={(event) => updateField("sortOrder", event.target.value)}
              value={form.sortOrder}
            />
          </label>
          <label className="admin-check-field">
            <input
              checked={form.published}
              name="published"
              onChange={(event) => updateField("published", event.target.checked)}
              type="checkbox"
            />
            공개
          </label>
          <div className="admin-form-actions">
            <button className="button" type="submit">
              {editingEntry ? "수정 저장" : isSponsor ? "후원사 추가" : "추가하기"}
            </button>
            {editingEntry ? (
              <button className="admin-button secondary" onClick={resetForm} type="button">
                취소
              </button>
            ) : null}
          </div>
        </form>
        {status ? <p className="status">{status}</p> : null}
      </section>

      <section className="admin-section">
        <h2>{isSponsor ? "등록된 후원사" : "등록된 운영진"}</h2>
        {loading ? (
          <div className="admin-status-line">목록을 불러오는 중입니다.</div>
        ) : isSponsor ? (
          <div className="admin-sponsor-columns">
            <div className="admin-sponsor-column">
              <h3>일반 후원사</h3>
              {sponsorEntries.length ? (
                <div className="admin-about-entry-list">
                  {sponsorEntries.map((entry) => (
                    <article className="admin-about-entry-row" key={entry.id}>
                      <div
                        className="admin-about-entry-photo"
                        style={entry.image_url ? { backgroundImage: `url(${entry.image_url})` } : undefined}
                      >
                        {entry.image_url ? null : entry.title.slice(0, 1)}
                      </div>
                      <div>
                        <strong>{entry.title}</strong>
                        <span>일반 후원사</span>
                        <small>{entry.body || "소개 미입력"}</small>
                      </div>
                      <div className="admin-about-entry-state">
                        <span>{entry.published ? "공개" : "비공개"}</span>
                        <button className="admin-text-button" onClick={() => edit(entry)} type="button">
                          수정
                        </button>
                        <button className="admin-text-button danger" onClick={() => void remove(entry)} type="button">
                          삭제
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-note">아직 등록된 일반 후원사가 없습니다.</div>
              )}
            </div>
            <div className="admin-sponsor-column">
              <h3>제휴 파트너</h3>
              {partnerEntries.length ? (
                <div className="admin-about-entry-list">
                  {partnerEntries.map((entry) => (
                    <article className="admin-about-entry-row" key={entry.id}>
                      <div
                        className="admin-about-entry-photo"
                        style={entry.image_url ? { backgroundImage: `url(${entry.image_url})` } : undefined}
                      >
                        {entry.image_url ? null : entry.title.slice(0, 1)}
                      </div>
                      <div>
                        <strong>{entry.title}</strong>
                        <span>제휴 파트너</span>
                        <small>{entry.body || entry.benefits || "혜택/소개 미입력"}</small>
                      </div>
                      <div className="admin-about-entry-state">
                        <span>{entry.published ? "공개" : "비공개"}</span>
                        <button className="admin-text-button" onClick={() => edit(entry)} type="button">
                          수정
                        </button>
                        <button className="admin-text-button danger" onClick={() => void remove(entry)} type="button">
                          삭제
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="admin-note">아직 등록된 제휴 파트너가 없습니다.</div>
              )}
            </div>
          </div>
        ) : shownEntries.length ? (
          <div className="admin-about-entry-list">
            {shownEntries.map((entry) => (
              <article className="admin-about-entry-row" key={entry.id}>
                <div
                  className="admin-about-entry-photo"
                  style={entry.image_url ? { backgroundImage: `url(${entry.image_url})` } : undefined}
                >
                  {entry.image_url ? null : entry.title.slice(0, 1)}
                </div>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.entry_type === "sponsor" ? sponsorKindLabel(entry.sponsor_kind) : entry.subtitle ?? "구분 없음"}</span>
                  <small>{entry.body || (entry.entry_type === "sponsor" ? "소개/혜택 미입력" : "직책 미입력")}</small>
                </div>
                <div className="admin-about-entry-state">
                  <span>{entry.published ? "공개" : "비공개"}</span>
                  <button className="admin-text-button" onClick={() => edit(entry)} type="button">
                    수정
                  </button>
                  <button className="admin-text-button danger" onClick={() => void remove(entry)} type="button">
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-note">
            {isSponsor ? "아직 등록된 후원사가 없습니다." : "아직 등록된 운영진이 없습니다."}
          </div>
        )}
      </section>
    </main>
  );
}
