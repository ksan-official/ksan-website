"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type AdminMapSpot = {
  category: "cafe" | "food" | "study";
  city: string | null;
  created_at: string;
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
};

const categoryLabels: Record<AdminMapSpot["category"], string> = {
  cafe: "카페",
  food: "맛집",
  study: "공부 스팟"
};

export default function AdminMapSpotsPage() {
  const [spots, setSpots] = useState<AdminMapSpot[]>([]);
  const [status, setStatus] = useState("장소를 불러오는 중입니다.");

  const request = useCallback(async (path = "", options: RequestInit = {}) => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("관리자 계정으로 먼저 로그인해주세요.");

    return fetch(`/api/admin/map-spots${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${data.session.access_token}` }
    });
  }, []);

  const loadSpots = useCallback(async () => {
    try {
      const response = await request();
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSpots(result.spots ?? []);
      setStatus(result.spots?.length ? "" : "등록된 장소가 없습니다.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "장소를 불러오지 못했습니다.");
    }
  }, [request]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSpots();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadSpots]);

  async function updateSpot(id: string, patch: Partial<Pick<AdminMapSpot, "published">>) {
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

    await loadSpots();
  }

  async function removeSpot(spot: AdminMapSpot) {
    if (!window.confirm(`‘${spot.name}’ 장소를 삭제할까요? 삭제 후에는 복구할 수 없습니다.`)) return;

    setStatus("장소를 삭제하는 중입니다.");
    const response = await request(`?id=${spot.id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result.error);
      return;
    }

    await loadSpots();
  }

  return (
    <main className="admin-page" id="main">
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Map Spots</p>
          <h1>지도 장소 관리</h1>
          <p>학생 큐레이션 지도에 노출되는 장소를 관리합니다. Google Maps 링크, 도시, 카테고리, 공개 여부를 여기서 바꿀 수 있습니다.</p>
        </div>
        <Link className="admin-button" href="/admin/map-spots/new">새 장소 등록</Link>
      </header>

      <section className="admin-section">
        <div className="admin-business-list-header">
          <strong>{spots.length}개 장소</strong>
          <span>공개 {spots.filter((spot) => spot.published).length}개</span>
        </div>
        <div className="admin-business-list">
          {spots.map((spot) => (
            <article className="admin-business-row" key={spot.id}>
              <div className="admin-business-row-main">
                <span>{spot.city ?? "도시 미정"} · {categoryLabels[spot.category]}</span>
                <h2>{spot.name}</h2>
                <div className="admin-tag-list">
                  <span>{spot.neighborhood ?? "지역 미정"}</span>
                  <span>정렬 {spot.sort_order}</span>
                  <span>{spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</span>
                  {spot.google_maps_url ? <span>Google Maps 링크 있음</span> : <span>링크 없음</span>}
                </div>
                {spot.description ? <p className="admin-note">{spot.description}</p> : null}
              </div>
              <div className="admin-business-state">
                <Link href={`/admin/map-spots/${spot.id}/edit`}>수정</Link>
                <label>
                  <input
                    checked={spot.published}
                    onChange={(event) => void updateSpot(spot.id, { published: event.target.checked })}
                    type="checkbox"
                  />
                  공개
                </label>
                <button className="admin-text-button danger" onClick={() => void removeSpot(spot)} type="button">삭제</button>
              </div>
            </article>
          ))}
        </div>
        {status ? <p className="admin-note">{status}</p> : null}
      </section>
    </main>
  );
}
