"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Coffee,
  ExternalLink,
  Map,
  MapPin,
  Utensils
} from "lucide-react";

type SpotCategory = "all" | "cafe" | "food" | "study";

type AmsterdamSpot = {
  category: Exclude<SpotCategory, "all">;
  description: string;
  id: string;
  name: string;
  sourceLabel: string;
};

const categories: Array<{
  id: SpotCategory;
  label: string;
  icon: typeof Map;
  publicListUrl?: string;
}> = [
  { id: "all", label: "전체", icon: Map },
  {
    id: "cafe",
    label: "카페",
    icon: Coffee,
    publicListUrl: "https://maps.app.goo.gl/AJw35F6oMZ11ypy97"
  },
  {
    id: "food",
    label: "맛집",
    icon: Utensils,
    publicListUrl: "https://maps.app.goo.gl/cL9qwJgA5WJW12qg6"
  },
  {
    id: "study",
    label: "공부 스팟",
    icon: BookOpen,
    publicListUrl: "https://maps.app.goo.gl/mRk3EhGniLoKbfcq9"
  }
];

const spots: AmsterdamSpot[] = [
  {
    category: "cafe",
    description: "KSAN Drive의 카페 공개 목록에 저장된 장소입니다.",
    id: "louf-de-pijp",
    name: "louf - de pijp",
    sourceLabel: "KSAN Drive · 카페"
  },
  {
    category: "cafe",
    description: "KSAN Drive의 카페 공개 목록에 저장된 장소입니다.",
    id: "tea-kee-bubble-tea",
    name: "TEA KEE Bubble Tea 奶茶 Amsterdam",
    sourceLabel: "KSAN Drive · 카페"
  },
  {
    category: "cafe",
    description: "KSAN Drive의 카페 공개 목록에 저장된 장소입니다.",
    id: "pantopia",
    name: "Pantopia",
    sourceLabel: "KSAN Drive · 카페"
  },
  {
    category: "cafe",
    description: "KSAN Drive의 카페 공개 목록에 저장된 장소입니다.",
    id: "two-story",
    name: "Two Story",
    sourceLabel: "KSAN Drive · 카페"
  },
  {
    category: "cafe",
    description: "KSAN Drive의 카페 공개 목록에 저장된 장소입니다.",
    id: "yusu",
    name: "YUSU",
    sourceLabel: "KSAN Drive · 카페"
  },
  {
    category: "cafe",
    description: "KSAN Drive의 카페 공개 목록에 저장된 장소입니다.",
    id: "baking-lab-amsterdam",
    name: "Baking Lab Amsterdam",
    sourceLabel: "KSAN Drive · 카페"
  },
  {
    category: "food",
    description: "KSAN Drive의 맛집 공개 목록에 저장된 장소입니다.",
    id: "impero-romano-amsterdam",
    name: "Impero Romano Amsterdam",
    sourceLabel: "KSAN Drive · 맛집"
  },
  {
    category: "food",
    description: "KSAN Drive의 맛집 공개 목록에 저장된 장소입니다.",
    id: "lagom-amsterdam",
    name: "Lagom Amsterdam",
    sourceLabel: "KSAN Drive · 맛집"
  },
  {
    category: "food",
    description: "KSAN Drive의 맛집 공개 목록에 저장된 장소입니다.",
    id: "olido-pizzeria-amsterdam-oost",
    name: "Olidò - Pizzeria Amsterdam Oost",
    sourceLabel: "KSAN Drive · 맛집"
  },
  {
    category: "food",
    description: "KSAN Drive의 맛집 공개 목록에 저장된 장소입니다.",
    id: "sushi-fanatics",
    name: "Sushi Fanatics",
    sourceLabel: "KSAN Drive · 맛집"
  },
  {
    category: "food",
    description: "KSAN Drive의 맛집 공개 목록에 저장된 장소입니다.",
    id: "the-cottage",
    name: "The Cottage",
    sourceLabel: "KSAN Drive · 맛집"
  },
  {
    category: "food",
    description: "KSAN Drive의 맛집 공개 목록에 저장된 장소입니다.",
    id: "soju-amsterdam",
    name: "소주",
    sourceLabel: "KSAN Drive · 맛집"
  },
  {
    category: "food",
    description: "KSAN Drive의 맛집 공개 목록에 저장된 장소입니다.",
    id: "linguini-de-pijp",
    name: "Linguini de Pijp",
    sourceLabel: "KSAN Drive · 맛집"
  },
  {
    category: "study",
    description: "KSAN Drive의 공부 스팟 공개 목록에 저장된 장소입니다.",
    id: "oba-oosterdok-public-library",
    name: "OBA Oosterdok - Public Library",
    sourceLabel: "KSAN Drive · 공부 스팟"
  },
  {
    category: "study",
    description: "KSAN Drive의 공부 스팟 공개 목록에 저장된 장소입니다.",
    id: "amsterdam-university-library",
    name: "Amsterdam University Library",
    sourceLabel: "KSAN Drive · 공부 스팟"
  }
];

function mapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function mapsEmbedUrl(query: string, zoom = 13) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=${zoom}&output=embed&hl=ko`;
}

export function AmsterdamSpotMap() {
  const [activeCategory, setActiveCategory] = useState<SpotCategory>("all");
  const [selectedSpotId, setSelectedSpotId] = useState<string>(spots[0].id);

  const filteredSpots = useMemo(
    () =>
      activeCategory === "all"
        ? spots
        : spots.filter((spot) => spot.category === activeCategory),
    [activeCategory]
  );

  const selectedSpot = spots.find((spot) => spot.id === selectedSpotId) ?? spots[0];
  const activeCategoryInfo = categories.find((category) => category.id === activeCategory) ?? categories[0];
  const mapQuery = `${selectedSpot.name}, Amsterdam, Netherlands`;
  const embedUrl = mapsEmbedUrl(mapQuery, 16);
  const externalMapUrl = mapsSearchUrl(mapQuery);

  function selectCategory(category: SpotCategory) {
    const nextSpots = category === "all" ? spots : spots.filter((spot) => spot.category === category);
    setActiveCategory(category);
    setSelectedSpotId(nextSpots[0].id);
  }

  return (
    <section className="section amsterdam-map-section" data-map-section data-motion-section>
      <div className="map-intro">
        <div>
          <p className="map-kicker">KSAN Amsterdam Picks</p>
          <h2>
            학생의 하루가 더 즐거워지는
            <br />
            암스테르담 스팟
          </h2>
        </div>
        <p data-map-copy>
          과제하기 좋은 자리부터 오래 머물고 싶은 카페까지. 선배와 학생들이 직접 고른 장소를
          취향대로 살펴보세요.
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
            </button>
          );
        })}
      </div>

      <div className="map-explorer" data-map-explorer>
        <aside className="map-spot-panel" aria-label={`${activeCategoryInfo.label} 추천 장소`}>
          <div className="map-panel-heading">
            <div>
              <span>{activeCategoryInfo.label}</span>
              <strong>{filteredSpots.length}곳의 추천</strong>
            </div>
            {activeCategoryInfo.publicListUrl ? (
              <a
                className="map-public-list-link"
                href={activeCategoryInfo.publicListUrl}
                rel="noreferrer"
                target="_blank"
              >
                공개 목록
                <ExternalLink aria-hidden size={14} />
              </a>
            ) : (
              <span className="map-live-dot" aria-label="KSAN 큐레이션 목록" />
            )}
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
                  <span>{spot.sourceLabel}</span>
                  <small>{spot.description}</small>
                </span>
                <MapPin aria-hidden size={18} />
              </button>
            ))}
          </div>
        </aside>

        <div className="map-stage" data-map-stage>
          <iframe
            allowFullScreen
            className="map-frame"
            key={embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={embedUrl}
            title={`${selectedSpot.name} Google 지도`}
          />

          <div className="map-stage-topline">
            <span>
              <MapPin aria-hidden size={15} />
              Amsterdam
            </span>
            <span>KSAN curated</span>
          </div>

          <div className="map-place-callout" aria-live="polite">
            <div>
              <span>{selectedSpot.sourceLabel}</span>
              <strong>{selectedSpot.name}</strong>
              <p>{selectedSpot.description}</p>
            </div>
            <a href={externalMapUrl} rel="noreferrer" target="_blank">
              Google Maps에서 열기
              <ExternalLink aria-hidden size={17} />
            </a>
          </div>
        </div>
      </div>

      <p className="map-source-note">
        KSAN 학생 큐레이션 · 장소 정보는 운영 상황에 따라 변경될 수 있습니다.
      </p>
    </section>
  );
}
