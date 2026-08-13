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

function mapsSearchUrl(spot: MapSpot) {
  if (spot.googleMapsUrl) {
    return spot.googleMapsUrl;
  }

  const query = `${spot.name}, Amsterdam, Netherlands`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [dataSource, setDataSource] = useState<"fallback" | "supabase">("fallback");

  const filteredSpots = useMemo(
    () => activeCategory === "all" ? spots : spots.filter((spot) => spot.category === activeCategory),
    [activeCategory, spots]
  );
  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) ?? null;
  const activeCategoryInfo = categories.find((category) => category.id === activeCategory) ?? categories[0];

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
      center: [4.9041, 52.3676],
      container: containerRef.current,
      dragRotate: false,
      maxPitch: 0,
      pitchWithRotate: false,
      style: {
        layers: [
          {
            id: "ksan-basemap",
            paint: {
              "raster-brightness-max": 0.98,
              "raster-brightness-min": 0.08,
              "raster-contrast": -0.08,
              "raster-saturation": -0.38
            },
            source: "carto-positron",
            type: "raster"
          }
        ],
        sources: {
          "carto-positron": {
            attribution: "© OpenStreetMap contributors © CARTO",
            tileSize: 256,
            tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
            type: "raster"
          }
        },
        version: 8
      },
      zoom: 12
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
      const element = document.createElement("button");
      element.className = `ksan-map-marker ksan-map-marker--${spot.category}`;
      element.type = "button";
      element.setAttribute("aria-label", `${spot.name} 선택`);
      element.dataset.spotId = spot.id;
      element.innerHTML = `
        <svg aria-hidden="true" viewBox="0 0 32 42">
          <path d="M16 1.5C8.27 1.5 2 7.76 2 15.5c0 10.42 12.15 24.13 13.01 25.08a1.34 1.34 0 0 0 1.98 0C17.85 39.63 30 25.92 30 15.5 30 7.76 23.73 1.5 16 1.5Z" />
          <circle cx="16" cy="15.5" r="5.1" />
        </svg>
      `;
      element.addEventListener("click", () => setSelectedSpotId(spot.id));

      const marker = new maplibregl.Marker({ anchor: "bottom", element })
        .setLngLat([spot.longitude, spot.latitude])
        .addTo(map);
      markersRef.current.set(spot.id, marker);
    });

    fitSpots(map, filteredSpots);
  }, [filteredSpots, mapReady]);

  useEffect(() => {
    markersRef.current.forEach((marker, spotId) => {
      marker.getElement().classList.toggle("is-selected", spotId === selectedSpotId);
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
  }, [selectedSpot, selectedSpotId]);

  function selectCategory(category: CategoryFilter) {
    setActiveCategory(category);
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
          <p className="map-kicker">KSAN Amsterdam Picks</p>
          <h2>학생의 하루가 더 즐거워지는<br />암스테르담 스팟</h2>
        </div>
        <p data-map-copy>
          과제하기 좋은 자리부터 오래 머물고 싶은 카페까지. 학생들이 직접 고른 장소만
          지도 위에 담았습니다.
        </p>
      </div>

      <div className="map-category-bar" aria-label="장소 카테고리">
        {categories.map((category) => {
          const Icon = category.icon;
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
              <span>{category.id === "all" ? spots.length : spots.filter((spot) => spot.category === category.id).length}</span>
            </button>
          );
        })}
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
            {filteredSpots.map((spot, index) => (
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
                  <span>{spot.neighborhood ?? "Amsterdam"} · {activeCategoryInfo.label === "전체" ? categories.find((item) => item.id === spot.category)?.label : activeCategoryInfo.label}</span>
                  <small>{spot.description}</small>
                </span>
                <MapPin aria-hidden size={18} />
              </button>
            ))}
          </div>
        </aside>

        <div className="map-stage" data-map-stage>
          <div aria-label="KSAN 암스테르담 추천 지도" className="maplibre-canvas" ref={containerRef} />
          <div aria-hidden className="map-wash" />

          <div className="map-stage-topline">
            <span><MapPin aria-hidden size={15} /> Amsterdam</span>
            <button onClick={resetMapView} type="button"><LocateFixed aria-hidden size={15} /> 전체 범위</button>
          </div>

          <div className={`map-place-callout ${selectedSpot ? "is-detail" : "is-overview"}`} aria-live="polite">
            {selectedSpot ? (
              <>
                <div>
                  <span>{selectedSpot.neighborhood ?? "Amsterdam"} · KSAN Pick</span>
                  <strong>{selectedSpot.name}</strong>
                  <p>{selectedSpot.description}</p>
                </div>
                <a href={mapsSearchUrl(selectedSpot)} rel="noreferrer" target="_blank">
                  Google Maps에서 열기 <ExternalLink aria-hidden size={17} />
                </a>
              </>
            ) : (
              <div>
                <span>{activeCategoryInfo.label} · Map overview</span>
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
