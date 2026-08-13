"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function NewMapSpotPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("저장 중입니다.");
    const formData = new FormData(event.currentTarget);

    try {
      const supabase = createBrowserSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus("저장 실패: 관리자 계정으로 먼저 로그인해야 합니다.");
        return;
      }

      const response = await fetch("/api/admin/map-spots", {
        body: JSON.stringify({
          address: formData.get("address"),
          category: formData.get("category"),
          description: formData.get("description"),
          googleMapsUrl: formData.get("googleMapsUrl"),
          latitude: formData.get("latitude"),
          longitude: formData.get("longitude"),
          name: formData.get("name"),
          neighborhood: formData.get("neighborhood"),
          published: formData.get("published") === "on",
          sortOrder: formData.get("sortOrder"),
          sourceListUrl: formData.get("sourceListUrl")
        }),
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const result = await response.json();
      setStatus(response.ok ? `장소가 저장되었습니다. (${result.slug})` : `저장 실패: ${result.error}`);
      if (response.ok) {
        event.currentTarget.reset();
      }
    } catch (error) {
      setStatus(`저장 실패: ${error instanceof Error ? error.message : "설정을 확인해주세요."}`);
    }
  }

  return (
    <main className="page" id="main">
      <h1 className="page-title">지도 장소 등록</h1>
      <p className="lead">KSAN 지도에 노출할 장소와 좌표를 등록합니다. 공개를 켜면 랜딩 페이지에 반영됩니다.</p>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>장소명</span><input name="name" required /></label>
        <label className="field">
          <span>카테고리</span>
          <select defaultValue="cafe" name="category">
            <option value="cafe">카페</option>
            <option value="food">맛집</option>
            <option value="study">공부 스팟</option>
          </select>
        </label>
        <div className="admin-coordinate-grid">
          <label className="field"><span>위도</span><input inputMode="decimal" name="latitude" placeholder="52.3676" required type="number" step="any" /></label>
          <label className="field"><span>경도</span><input inputMode="decimal" name="longitude" placeholder="4.9041" required type="number" step="any" /></label>
        </div>
        <label className="field"><span>지역</span><input name="neighborhood" placeholder="De Pijp, Oost, Centrum" /></label>
        <label className="field"><span>주소</span><input name="address" /></label>
        <label className="field"><span>한 줄 소개</span><textarea name="description" rows={3} /></label>
        <label className="field"><span>Google Maps 장소 링크</span><input name="googleMapsUrl" type="url" /></label>
        <label className="field"><span>Google Maps 공개 목록 링크</span><input name="sourceListUrl" type="url" /></label>
        <label className="field"><span>정렬 순서</span><input defaultValue="0" name="sortOrder" type="number" /></label>
        <label className="admin-check"><input defaultChecked name="published" type="checkbox" /> 바로 공개</label>
        <button className="button" type="submit">장소 저장</button>
      </form>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
