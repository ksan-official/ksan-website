"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import {
  BookOpen,
  Coffee,
  ExternalLink,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Utensils
} from "lucide-react";
import {
  fallbackMapSpots,
  mapCategoryListUrls,
  type MapSpot,
  type SpotCategory
} from "@/lib/map-spots";

type CategoryFilter = "all" | SpotCategory;
type CityFilter = "all" | string;

const categories: Array<{
  id: CategoryFilter;
  label: string;
  icon: typeof MapIcon;
  publicListUrl?: string;
}> = [
  { id: "all", label: "전체", icon: MapIcon },
  { id: "cafe", label: "카페", icon: Coffee, publicListUrl: mapCategoryListUrls.cafe },
  { id: "food", label: "맛집", icon: Utensils, publicListUrl: mapCategoryListUrls.food },
  { id: "study", label: "공부 스팟", icon: BookOpen, publicListUrl: mapCategoryListUrls.study }
];

const markerIcons: Record<SpotCategory, string> = {
  cafe: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h10v5a5 5 0 0 1-5 5 5 5 0 0 1-5-5V7Z"/><path d="M15 9h2.2a2.3 2.3 0 0 1 0 4.6H15"/><path d="M4 20h13"/><path d="M8 4v1"/><path d="M12 4v1"/></svg>`,
  food: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 3v8"/><path d="M10 3v8"/><path d="M7 7h3"/><path d="M8.5 11v10"/><path d="M17 3v18"/><path d="M14 3v7a3 3 0 0 0 3 3"/></svg>`,
  study: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M8 7h8"/><path d="M8 11h6"/></svg>`
};

function mapsSearchUrl(spot: MapSpot) {
  if (spot.googleMapsUrl) {
    return spot.googleMapsUrl;
  }

  const query = `${spot.name}, Netherlands`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function shortSpotName(name: string) {
  return name
    .replace(/\s+Amsterdam\b/i, "")
    .replace(/\s+-\s+/g, " ")
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
}

function fitSpots(map: MapLibreMap, spots: MapSpot[]) {
  if (!spots.length) {
    return;
  }

  if (spots.length === 1) {
    map.easeTo({ center: [spots[0].longitude, spots[0].latitude], duration: 900, zoom: 14.8 });
    return;
  }

  const bounds = spots.reduce(
    (nextBounds, spot) => nextBounds.extend([spot.longitude, spot.latitude]),
    new maplibregl.LngLatBounds(
      [spots[0].longitude, spots[0].latitude],
      [spots[0].longitude, spots[0].latitude]
    )
  );

  map.fitBounds(bounds, {
    duration: 1100,
    maxZoom: 13.4,
    padding: { bottom: 148, left: 62, right: 62, top: 72 }
  });
}

export function AmsterdamSpotMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [spots, setSpots] = useState<MapSpot[]>(fallbackMapSpots);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeCity, setActiveCity] = useState<CityFilter>("Amsterdam");
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [dataSource, setDataSource] = useState<"fallback" | "supabase">("fallback");

  const cityFilters = useMemo(() => {
    const cities = Array.from(new Set(spots.map((spot) => spot.city).filter(Boolean) as string[]));
    return cities.sort((a, b) => a.localeCompare(b));
  }, [spots]);
  const cityScopedSpots = useMemo(
    () => activeCity === "all" ? spots : spots.filter((spot) => spot.city === activeCity),
    [activeCity, spots]
  );
  const filteredSpots = useMemo(
    () => spots.filter((spot) => {
      const matchesCategory = activeCategory === "all" || spot.category === activeCategory;
      const matchesCity = activeCity === "all" || spot.city === activeCity;
      return matchesCategory && matchesCity;
    }),
    [activeCategory, activeCity, spots]
  );
  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) ?? null;
  const hoveredSpot = spots.find((spot) => spot.id === hoveredSpotId) ?? null;
  const previewSpot = selectedSpot ?? hoveredSpot;
  const activeCategoryInfo = categories.find((category) => category.id === activeCategory) ?? categories[0];

  useEffect(() => {
    if (!cityFilters.length || activeCity === "all" || cityFilters.includes(activeCity)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveCity(cityFilters.includes("Amsterdam") ? "Amsterdam" : cityFilters[0]);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [activeCity, cityFilters]);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/map-spots", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { source?: "fallback" | "supabase"; spots?: MapSpot[] }) => {
        if (payload.spots?.length) {
          setSpots(payload.spots);
          setDataSource(payload.source ?? "fallback");
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      attributionControl: false,
      center: [5.2913, 52.1326],
      container: containerRef.current,
      dragRotate: false,
      maxPitch: 0,
      pitchWithRotate: false,
      style: {
        layers: [
          {
            id: "ksan-basemap",
            paint: {
              "raster-brightness-max": 1,
              "raster-brightness-min": 0.02,
              "raster-contrast": 0.04,
              "raster-saturation": 0.08
            },
            source: "carto-positron",
            type: "raster"
          }
        ],
        sources: {
          "carto-positron": {
            attribution: "© OpenStreetMap contributors © CARTO",
            tileSize: 256,
            tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"],
            type: "raster"
          }
        },
        version: 8
      },
      zoom: 7
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.once("style.load", () => setMapReady(true));
    mapRef.current = map;
    const markers = markersRef.current;

    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    filteredSpots.forEach((spot) => {
      const spotName = escapeHtml(spot.name);
      const spotLabel = escapeHtml(shortSpotName(spot.name));
      const spotDescription = escapeHtml(spot.description);
      const spotLocation = escapeHtml(`${spot.city ?? "Netherlands"}${spot.neighborhood ? ` · ${spot.neighborhood}` : ""}`);
      const element = document.createElement("div");
      element.className = `ksan-map-marker ksan-map-marker--${spot.category}`;
      element.setAttribute("aria-label", `${spot.name} Google Maps에서 열기`);
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.dataset.spotId = spot.id;
      element.innerHTML = `
        <span class="ksan-map-marker-core">
          <span class="ksan-map-marker-bubble">${markerIcons[spot.category]}</span>
          <span class="ksan-map-marker-label">${spotLabel}</span>
        </span>
        <span class="ksan-map-preview">
          <span class="ksan-map-preview-body">
            <strong>${spotName}</strong>
            <span>${spotLocation}</span>
            ${spot.description.trim() ? `<small>${spotDescription}</small>` : ""}
            <span class="ksan-map-preview-button">Google Maps에서 열기</span>
          </span>
        </span>
      `;
      element.addEventListener("mouseenter", () => setHoveredSpotId(spot.id));
      element.addEventListener("mouseleave", () => setHoveredSpotId((current) => current === spot.id ? null : current));
      element.addEventListener("focus", () => setHoveredSpotId(spot.id));
      element.addEventListener("blur", () => setHoveredSpotId((current) => current === spot.id ? null : current));
      element.addEventListener("click", () => {
        window.open(mapsSearchUrl(spot), "_blank", "noopener,noreferrer");
      });
      element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          window.open(mapsSearchUrl(spot), "_blank", "noopener,noreferrer");
        }
      });

      const marker = new maplibregl.Marker({ anchor: "bottom", element })
        .setLngLat([spot.longitude, spot.latitude])
        .addTo(map);
      markersRef.current.set(spot.id, marker);
    });

    fitSpots(map, filteredSpots);
  }, [filteredSpots, mapReady]);

  useEffect(() => {
    markersRef.current.forEach((marker, spotId) => {
      marker.getElement().classList.toggle("is-selected", spotId === selectedSpotId || spotId === hoveredSpotId);
    });

    const map = mapRef.current;
    if (map && selectedSpot) {
      map.flyTo({
        center: [selectedSpot.longitude, selectedSpot.latitude],
        duration: 950,
        essential: true,
        zoom: 15.2
      });
    }
  }, [hoveredSpotId, selectedSpot, selectedSpotId]);

  function selectCategory(category: CategoryFilter) {
    setActiveCategory(category);
    setSelectedSpotId(null);
  }

  function selectCity(city: CityFilter) {
    setActiveCity(city);
    setSelectedSpotId(null);
  }

  function resetMapView() {
    setSelectedSpotId(null);
    if (mapRef.current) {
      fitSpots(mapRef.current, filteredSpots);
    }
  }

  return (
    <section className="section amsterdam-map-section" data-map-section data-motion-section>
      <div className="map-intro">
        <div>
          <p className="map-kicker">KSAN Netherlands Picks</p>
          <h2>학생의 하루가 더 즐거워지는<br />네덜란드 스팟</h2>
        </div>
        <p data-map-copy>
          과제하기 좋은 자리부터 오래 머물고 싶은 카페까지. 네덜란드 곳곳의 장소를
          지도 위에 담았습니다.
        </p>
      </div>

      <div className="map-filter-group is-primary">
        <span className="map-filter-label">1. 도시 선택</span>
        <div className="map-city-bar" aria-label="도시 필터">
          {cityFilters.length ? cityFilters.map((city) => (
            <button aria-pressed={activeCity === city} key={city} onClick={() => selectCity(city)} type="button">
              {city} <span>{spots.filter((spot) => spot.city === city).length}</span>
            </button>
          )) : (
            <button aria-pressed="true" disabled type="button">등록된 도시 없음 <span>0</span></button>
          )}
        </div>
      </div>

      <div className="map-filter-group">
        <span className="map-filter-label">2. 장소 유형 선택</span>
        <div className="map-category-bar" aria-label="장소 카테고리">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = category.id === "all"
              ? cityScopedSpots.length
              : cityScopedSpots.filter((spot) => spot.category === category.id).length;

            return (
              <button
                aria-pressed={activeCategory === category.id}
                className="map-category-button"
                key={category.id}
                onClick={() => selectCategory(category.id)}
                type="button"
              >
                <Icon aria-hidden size={17} strokeWidth={2.1} />
                {category.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="map-explorer" data-map-explorer>
        <aside className="map-spot-panel" aria-label={`${activeCategoryInfo.label} 추천 장소`}>
          <div className="map-panel-heading">
            <div><span>{activeCategoryInfo.label}</span><strong>{filteredSpots.length}곳의 추천</strong></div>
            {activeCategoryInfo.publicListUrl ? (
              <a className="map-public-list-link" href={activeCategoryInfo.publicListUrl} rel="noreferrer" target="_blank">
                공개 목록 <ExternalLink aria-hidden size={14} />
              </a>
            ) : <span className="map-live-dot" aria-label="KSAN 큐레이션 목록" />}
          </div>

          <div className="map-spot-list">
            {filteredSpots.length ? filteredSpots.map((spot, index) => (
              <button
                aria-pressed={selectedSpot?.id === spot.id}
                className="map-spot-card"
                key={spot.id}
                onClick={() => setSelectedSpotId(spot.id)}
                type="button"
              >
                <span className="map-spot-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="map-spot-copy">
                  <strong>{spot.name}</strong>
                  <span>{spot.city ?? "Netherlands"}{spot.neighborhood ? ` · ${spot.neighborhood}` : ""} · {activeCategoryInfo.label === "전체" ? categories.find((item) => item.id === spot.category)?.label : activeCategoryInfo.label}</span>
                  {spot.description ? <small>{spot.description}</small> : null}
                </span>
                <MapPin aria-hidden size={18} />
              </button>
            )) : (
              <div className="map-empty-state">
                <strong>아직 등록된 장소가 없습니다.</strong>
                <span>다른 도시나 카테고리를 선택해보세요.</span>
              </div>
            )}
          </div>
        </aside>

        <div className="map-stage" data-map-stage>
          <div aria-label="KSAN 네덜란드 추천 지도" className="maplibre-canvas" ref={containerRef} />
          <div aria-hidden className="map-wash" />

          <div className="map-stage-topline">
            <span><MapPin aria-hidden size={15} /> Netherlands</span>
            <button onClick={resetMapView} type="button"><LocateFixed aria-hidden size={15} /> 전체 범위</button>
          </div>

          <div className={`map-place-callout ${previewSpot ? "is-detail" : "is-overview"}`} aria-live="polite">
            {previewSpot ? (
              <>
                <div>
                  <span>{previewSpot.city ?? "Netherlands"}{previewSpot.neighborhood ? ` · ${previewSpot.neighborhood}` : ""} · KSAN Pick</span>
                  <strong>{previewSpot.name}</strong>
                  {previewSpot.description ? <p>{previewSpot.description}</p> : null}
                </div>
                <a href={mapsSearchUrl(previewSpot)} rel="noreferrer" target="_blank">
                  바로 열기 <ExternalLink aria-hidden size={17} />
                </a>
              </>
            ) : (
              <div>
                <span>{activeCity === "all" ? "전체 도시" : activeCity} · Map overview</span>
                <strong>{activeCategory === "all" ? "저장된 모든 스팟을 한눈에" : `${activeCategoryInfo.label} 스팟을 한눈에`}</strong>
                <p>마커나 왼쪽 목록을 누르면 장소를 자세히 볼 수 있어요.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="map-source-note">
        KSAN 학생 큐레이션 · {dataSource === "supabase" ? "관리자 DB에서 업데이트됨" : "기본 큐레이션 데이터"} · 지도 © OpenStreetMap contributors
      </p>
    </section>
  );
}
