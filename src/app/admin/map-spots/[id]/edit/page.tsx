"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type EditableMapSpot = {
  address: string | null;
  category: "cafe" | "food" | "study";
  city: string | null;
  description: string | null;
  google_maps_url: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  neighborhood: string | null;
  published: boolean;
  slug: string;
  sort_order: number;
  source_list_url: string | null;
};

const cities = [
  "Amsterdam",
  "Rotterdam",
  "Den Haag",
  "Utrecht",
  "Eindhoven",
  "Groningen",
  "Leiden",
  "Maastricht",
  "Delft",
  "Tilburg",
  "Wageningen",
  "Other"
];

export default function EditMapSpotPage() {
  const { id } = useParams<{ id: string }>();
  const [spot, setSpot] = useState<EditableMapSpot | null>(null);
  const [status, setStatus] = useState("장소를 불러오는 중입니다.");

  const getSession = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");
    return data.session;
  }, []);

  useEffect(() => {
    getSession()
      .then(async (session) => {
        const response = await fetch("/api/admin/map-spots", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);

        const match = (result.spots as EditableMapSpot[]).find((item) => item.id === id) ?? null;
        setSpot(match);
        setStatus(match ? "" : "장소를 찾을 수 없습니다.");
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : "장소를 불러오지 못했습니다."));
  }, [getSession, id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("변경사항을 저장하는 중입니다.");
    const formData = new FormData(event.currentTarget);

    try {
      const session = await getSession();
      const response = await fetch("/api/admin/map-spots", {
        body: JSON.stringify({
          address: formData.get("address"),
          category: formData.get("category"),
          city: formData.get("city"),
          description: formData.get("description"),
          googleMapsUrl: formData.get("googleMapsUrl"),
          id,
          latitude: formData.get("latitude"),
          longitude: formData.get("longitude"),
          name: formData.get("name"),
          neighborhood: formData.get("neighborhood"),
          published: formData.get("published") === "on",
          slug: formData.get("slug"),
          sortOrder: formData.get("sortOrder"),
          sourceListUrl: formData.get("sourceListUrl")
        }),
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });
      const result = await response.json();
      setStatus(response.ok ? "변경사항을 저장했습니다." : `저장 실패: ${result.error}`);
    } catch (error) {
      setStatus(`저장 실패: ${error instanceof Error ? error.message : "설정을 확인해주세요."}`);
    }
  }

  if (!spot) {
    return (
      <main className="page" id="main">
        <h1 className="page-title">지도 장소 수정</h1>
        <p className="status">{status}</p>
      </main>
    );
  }

  return (
    <main className="page" id="main">
      <div className="admin-page-header">
        <div>
          <p className="admin-kicker">Map Spots</p>
          <h1 className="page-title">지도 장소 수정</h1>
          <p>{spot.city ?? "도시 미정"} · {spot.name}</p>
        </div>
        <Link className="admin-button secondary" href="/admin/map-spots">목록으로</Link>
      </div>

      <form className="form" onSubmit={submit}>
        <label className="field">
          <span>Google Maps 장소 링크</span>
          <input defaultValue={spot.google_maps_url ?? ""} name="googleMapsUrl" placeholder="https://maps.app.goo.gl/..." type="url" />
        </label>

        <div className="admin-two-column">
          <label className="field">
            <span>표시 이름</span>
            <input defaultValue={spot.name} name="name" required />
          </label>
          <label className="field">
            <span>Slug</span>
            <input defaultValue={spot.slug} name="slug" required />
          </label>
        </div>

        <div className="admin-two-column">
          <label className="field">
            <span>카테고리</span>
            <select defaultValue={spot.category} name="category">
              <option value="cafe">카페</option>
              <option value="food">맛집</option>
              <option value="study">공부 스팟</option>
            </select>
          </label>
          <label className="field">
            <span>도시</span>
            <select defaultValue={spot.city ?? "Other"} name="city">
              {cities.map((city) => <option key={city}>{city}</option>)}
            </select>
          </label>
        </div>

        <label className="field">
          <span>한 줄 소개</span>
          <textarea defaultValue={spot.description ?? ""} name="description" rows={3} />
        </label>

        <div className="admin-coordinate-grid">
          <label className="field">
            <span>위도</span>
            <input defaultValue={spot.latitude} inputMode="decimal" name="latitude" required step="any" type="number" />
          </label>
          <label className="field">
            <span>경도</span>
            <input defaultValue={spot.longitude} inputMode="decimal" name="longitude" required step="any" type="number" />
          </label>
        </div>

        <div className="admin-two-column">
          <label className="field">
            <span>지역</span>
            <input defaultValue={spot.neighborhood ?? ""} name="neighborhood" placeholder="De Pijp, Centrum" />
          </label>
          <label className="field">
            <span>정렬 순서</span>
            <input defaultValue={spot.sort_order} min="0" name="sortOrder" type="number" />
          </label>
        </div>

        <label className="field">
          <span>주소</span>
          <input defaultValue={spot.address ?? ""} name="address" />
        </label>
        <label className="field">
          <span>Google Maps 공개 목록 링크</span>
          <input defaultValue={spot.source_list_url ?? ""} name="sourceListUrl" type="url" />
        </label>

        <label className="admin-check">
          <input defaultChecked={spot.published} name="published" type="checkbox" />
          공개 페이지에 게시
        </label>
        <button className="button" type="submit">변경사항 저장</button>
      </form>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}
