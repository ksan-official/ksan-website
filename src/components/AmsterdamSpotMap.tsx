"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import {
  BookOpen,
  Coffee,
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
type CoordinateBounds = [[number, number], [number, number]];

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

const netherlandsBounds: CoordinateBounds = [
  [2.8, 50.55],
  [7.65, 53.75]
];
const cartoBasemapKey = process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY;
const cartoVoyagerTileUrl = `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${
  cartoBasemapKey ? `?key=${encodeURIComponent(cartoBasemapKey)}` : ""
}`;

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
  return displaySpotName(name)
    .replace(/\s+Amsterdam\b/i, "")
    .replace(/\s+-\s+/g, " ")
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
}

function displaySpotName(name: string) {
  return name.split(",")[0]?.trim() || name;
}

function categoryLabel(category: SpotCategory) {
  return categories.find((item) => item.id === category)?.label ?? "장소";
}

function spotPopupHtml(spot: MapSpot) {
  const description = spot.description.trim();

  return `
    <div class="ksan-map-popup-card">
      <span class="ksan-map-popup-kicker">${escapeHtml(categoryLabel(spot.category))}</span>
      <strong>${escapeHtml(displaySpotName(spot.name))}</strong>
      ${description ? `<p>${escapeHtml(description)}</p>` : ""}
      <a href="${escapeHtml(mapsSearchUrl(spot))}" target="_blank" rel="noreferrer">Google Maps에서 열기</a>
    </div>
  `;
}

function spotsDataKey(spots: MapSpot[]) {
  return spots
    .map((spot) => `${spot.id}:${spot.category}:${spot.latitude.toFixed(6)}:${spot.longitude.toFixed(6)}`)
    .join("|");
}

function spotCoordinateRanges(spots: MapSpot[]) {
  const latitudes = spots.map((spot) => spot.latitude);
  const longitudes = spots.map((spot) => spot.longitude);

  return {
    latitudes,
    longitudes,
    maxLatitude: Math.max(...latitudes),
    maxLongitude: Math.max(...longitudes),
    minLatitude: Math.min(...latitudes),
    minLongitude: Math.min(...longitudes)
  };
}

function boundsAroundSpots(spots: MapSpot[], minimumMargin = 0.045): CoordinateBounds {
  const { maxLatitude, maxLongitude, minLatitude, minLongitude } = spotCoordinateRanges(spots);
  const latitudeMargin = Math.max((maxLatitude - minLatitude) * 0.65, minimumMargin);
  const longitudeMargin = Math.max((maxLongitude - minLongitude) * 0.65, minimumMargin);

  return [
    [minLongitude - longitudeMargin, minLatitude - latitudeMargin],
    [maxLongitude + longitudeMargin, maxLatitude + latitudeMargin]
  ];
}

function configureZoomBoundary(map: MapLibreMap, city: CityFilter, citySpots: MapSpot[]) {
  if (city === "all" || !citySpots.length) {
    map.setMinZoom(6.2);
    map.setMaxBounds(netherlandsBounds);
    return;
  }

  map.setMinZoom(10.85);
  map.setMaxBounds(boundsAroundSpots(citySpots, 0.05));
}

function mapViewportPadding(map: MapLibreMap) {
  const { width } = map.getContainer().getBoundingClientRect();
  const edgePadding = width < 760 ? 42 : 72;

  return {
    bottom: edgePadding,
    left: edgePadding,
    right: edgePadding,
    top: edgePadding
  };
}

function fitSpots(map: MapLibreMap, spots: MapSpot[]) {
  if (!spots.length) {
    return;
  }

  if (spots.length === 1) {
    const bounds = boundsAroundSpots(spots, 0.012);
    map.fitBounds(bounds, {
      duration: 900,
      maxZoom: 14.8,
      padding: mapViewportPadding(map)
    });
    return;
  }

  const { maxLatitude, maxLongitude, minLatitude, minLongitude } =
    spotCoordinateRanges(spots);
  const latitudeRange = maxLatitude - minLatitude;
  const longitudeRange = maxLongitude - minLongitude;

  if (latitudeRange <= 0.12 && longitudeRange <= 0.16) {
    map.fitBounds(boundsAroundSpots(spots, 0.02), {
      duration: 900,
      maxZoom: latitudeRange <= 0.05 && longitudeRange <= 0.08 ? 13.35 : 12.7,
      padding: mapViewportPadding(map)
    });
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
    maxZoom: 12.2,
    padding: mapViewportPadding(map)
  });
}

export function AmsterdamSpotMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [spots, setSpots] = useState<MapSpot[]>(fallbackMapSpots);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeCity, setActiveCity] = useState<CityFilter>("Amsterdam");
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [selectedSpotRequest, setSelectedSpotRequest] = useState(0);
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

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
  const cityScopedSpotKey = useMemo(() => spotsDataKey(cityScopedSpots), [cityScopedSpots]);
  const filteredSpotKey = useMemo(() => spotsDataKey(filteredSpots), [filteredSpots]);
  const spotsRef = useRef<MapSpot[]>(spots);
  const cityScopedSpotsRef = useRef<MapSpot[]>(cityScopedSpots);
  const filteredSpotsRef = useRef<MapSpot[]>(filteredSpots);

  useEffect(() => {
    spotsRef.current = spots;
  }, [spots]);

  useEffect(() => {
    cityScopedSpotsRef.current = cityScopedSpots;
  }, [cityScopedSpots]);

  useEffect(() => {
    filteredSpotsRef.current = filteredSpots;
  }, [filteredSpots]);

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
      maxBounds: netherlandsBounds,
      maxPitch: 0,
      minZoom: 6.2,
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
            source: "carto-voyager",
            type: "raster"
          }
        ],
        sources: {
          "carto-voyager": {
            attribution: "© OpenStreetMap contributors © CARTO",
            tileSize: 256,
            tiles: [cartoVoyagerTileUrl],
            type: "raster"
          }
        },
        version: 8
      },
      zoom: 7
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    function markMapReady() {
      map.resize();
      setMapReady(true);
    }

    if (map.isStyleLoaded()) {
      markMapReady();
    } else {
      map.once("load", markMapReady);
    }

    mapRef.current = map;
    const markers = markersRef.current;

    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    map.resize();
    const nextCityScopedSpots = cityScopedSpotsRef.current;
    const nextFilteredSpots = filteredSpotsRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    nextFilteredSpots.forEach((spot) => {
      const element = document.createElement("button");
      element.className = `ksan-map-marker ksan-map-marker--${spot.category}`;
      element.type = "button";
      element.setAttribute("aria-label", `${spot.name} 선택`);
      element.innerHTML = `
        <span class="ksan-map-marker-visual">
          <span class="ksan-map-marker-icon">${markerIcons[spot.category]}</span>
          <span class="ksan-map-marker-label">${escapeHtml(shortSpotName(spot.name))}</span>
        </span>
      `;
      element.addEventListener("mouseenter", () => setHoveredSpotId(spot.id));
      element.addEventListener("mouseleave", () => setHoveredSpotId((current) => current === spot.id ? null : current));
      element.addEventListener("focus", () => setHoveredSpotId(spot.id));
      element.addEventListener("blur", () => setHoveredSpotId((current) => current === spot.id ? null : current));
      element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setSelectedSpotId(spot.id);
        setSelectedSpotRequest((request) => request + 1);
      });

      const marker = new maplibregl.Marker({ anchor: "center", element })
        .setLngLat([spot.longitude, spot.latitude])
        .addTo(map);
      markersRef.current.set(spot.id, marker);
    });

    configureZoomBoundary(map, activeCity, nextCityScopedSpots);

    fitSpots(map, nextFilteredSpots);
  }, [activeCity, cityScopedSpotKey, filteredSpotKey, mapReady]);

  useEffect(() => {
    markersRef.current.forEach((marker, spotId) => {
      marker.getElement().classList.toggle("is-active", spotId === selectedSpotId || spotId === hoveredSpotId);
    });
  }, [hoveredSpotId, selectedSpotId]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedSpot = spotsRef.current.find((spot) => spot.id === selectedSpotId) ?? null;
    if (!map || !selectedSpot) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

      popupRef.current?.remove();
      const popup = new maplibregl.Popup({
        anchor: "left",
        className: "ksan-map-popup",
        closeButton: true,
        closeOnClick: false,
        maxWidth: "260px",
        offset: 18
      })
        .setLngLat([selectedSpot.longitude, selectedSpot.latitude])
        .setHTML(spotPopupHtml(selectedSpot))
        .addTo(map);
      popup.on("close", () => {
        if (popupRef.current === popup) {
          popupRef.current = null;
          setSelectedSpotId((current) => current === selectedSpot.id ? null : current);
        }
      });
      popupRef.current = popup;

      map.flyTo({
        center: [selectedSpot.longitude, selectedSpot.latitude],
        duration: 950,
        essential: true,
        zoom: 15.2
      });
  }, [selectedSpotId, selectedSpotRequest]);

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
    popupRef.current?.remove();
    popupRef.current = null;
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
        <div className="map-stage" data-map-stage>
          <div aria-label="KSAN 네덜란드 추천 지도" className="maplibre-canvas" ref={containerRef} />
          <div aria-hidden className="map-wash" />

          <div className="map-stage-topline">
            <span><MapPin aria-hidden size={15} /> Netherlands</span>
            <button onClick={resetMapView} type="button"><LocateFixed aria-hidden size={15} /> 전체 범위</button>
          </div>
        </div>
      </div>

      <p className="map-source-note">
        KSAN 학생 큐레이션 · 지도 © OpenStreetMap contributors
      </p>
    </section>
  );
}
