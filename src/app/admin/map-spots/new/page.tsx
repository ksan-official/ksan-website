"use client";

import Link from "next/link";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

export default function NewMapSpotPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("저장 중입니다.");
    const form = event.currentTarget;
    const formData = new FormData(form);

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
          city: formData.get("city"),
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
      setStatus(response.ok ? `장소가 저장/업데이트되었습니다. (${result.slug})` : `저장 실패: ${result.error}`);
      if (response.ok) {
        form.reset();
      }
    } catch (error) {
      setStatus(`저장 실패: ${error instanceof Error ? error.message : "설정을 확인해주세요."}`);
    }
  }

  return (
    <main className="page" id="main">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Map Spots</p>
          <h1 className="page-title">지도 장소 등록</h1>
          <p>Google Maps 장소 링크를 붙여넣고 카테고리와 설명만 정리하면 KSAN 지도에 반영됩니다.</p>
        </div>
        <Link className="admin-button secondary" href="/admin/map-spots">목록으로</Link>
      </div>
      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Google Maps 장소 링크</span>
          <input name="googleMapsUrl" placeholder="https://maps.app.goo.gl/..." required type="url" />
        </label>
        <label className="field">
          <span>카테고리</span>
          <select defaultValue="cafe" name="category">
            <option value="cafe">카페</option>
            <option value="food">맛집</option>
            <option value="study">공부 스팟</option>
          </select>
        </label>
        <label className="field">
          <span>도시</span>
          <select defaultValue="Amsterdam" name="city">
            <option>Amsterdam</option>
            <option>Rotterdam</option>
            <option>Den Haag</option>
            <option>Utrecht</option>
            <option>Eindhoven</option>
            <option>Groningen</option>
            <option>Leiden</option>
            <option>Maastricht</option>
            <option>Delft</option>
            <option>Tilburg</option>
            <option>Wageningen</option>
            <option>Other</option>
          </select>
        </label>
        <label className="field"><span>한 줄 소개</span><textarea name="description" rows={3} /></label>
        <details className="admin-advanced-fields">
          <summary>자동 인식이 안 될 때 직접 입력</summary>
          <label className="field"><span>표시 이름</span><input name="name" placeholder="비워두면 링크에서 자동으로 가져옵니다." /></label>
          <div className="admin-coordinate-grid">
            <label className="field"><span>위도</span><input inputMode="decimal" name="latitude" placeholder="52.3676" type="number" step="any" /></label>
            <label className="field"><span>경도</span><input inputMode="decimal" name="longitude" placeholder="4.9041" type="number" step="any" /></label>
          </div>
          <label className="field"><span>지역</span><input name="neighborhood" placeholder="De Pijp, Oost, Centrum" /></label>
          <label className="field"><span>주소</span><input name="address" /></label>
          <label className="field"><span>Google Maps 공개 목록 링크</span><input name="sourceListUrl" type="url" /></label>
        </details>
        <label className="field"><span>정렬 순서</span><input defaultValue="0" name="sortOrder" type="number" /></label>
        <label className="admin-check"><input defaultChecked name="published" type="checkbox" /> 바로 공개</label>
        <button className="button" type="submit">장소 저장</button>
      </form>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
