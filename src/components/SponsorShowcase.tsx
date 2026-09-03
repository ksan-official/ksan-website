"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, Handshake } from "lucide-react";

export type SponsorEntry = {
  benefits: string | null;
  body: string | null;
  cta_url: string | null;
  id: string;
  image_url: string | null;
  sponsor_kind: "sponsor" | "partner" | null;
  subtitle: string | null;
  title: string;
  usage_guide: string | null;
};

const fallbackSponsors: SponsorEntry[] = [
  {
    benefits: null,
    body:
      "KSAN과 함께 학생 커뮤니티를 후원할 공식 후원사를 기다리고 있습니다.",
    cta_url: null,
    id: "official-partner",
    image_url: null,
    sponsor_kind: "sponsor",
    subtitle: "후원사",
    title: "공식 후원사 모집 중",
    usage_guide: null
  },
  {
    benefits: "학생 대상 혜택 제공\n커리어 토크 운영\n현직자 네트워킹",
    body:
      "학생들의 진로 탐색과 채용 기회를 함께 넓혀갈 제휴 파트너 영역입니다.",
    cta_url: null,
    id: "career-partner",
    image_url: null,
    sponsor_kind: "partner",
    subtitle: "제휴 파트너",
    title: "커리어 파트너 모집 중",
    usage_guide: "이용 방법은 제휴 서비스 공개 시 함께 안내됩니다."
  },
  {
    benefits: "학생 할인 또는 혜택 제공\n문화 행사 협업\n커뮤니티 캠페인",
    body:
      "문화, 생활, 네트워킹 프로그램을 함께 만들어갈 제휴 파트너 영역입니다.",
    cta_url: null,
    id: "community-partner",
    image_url: null,
    sponsor_kind: "partner",
    subtitle: "제휴 파트너",
    title: "커뮤니티 파트너 모집 중",
    usage_guide: "이용 방법은 제휴 서비스 공개 시 함께 안내됩니다."
  }
];

function lines(value: string | null) {
  return (value ?? "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
}

function parsedBody(entry: SponsorEntry) {
  const legacyLines = lines(entry.body);
  const benefits = lines(entry.benefits);
  const legacyBenefits = benefits.length ? benefits : legacyLines.slice(1);

  return {
    benefits: legacyBenefits,
    description: legacyLines[0] ?? "KSAN과 함께하는 파트너를 소개합니다.",
    usageGuide: entry.usage_guide
  };
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "KS";
}

export function SponsorShowcase({ sponsors }: { sponsors: SponsorEntry[] }) {
  const allItems = sponsors.length ? sponsors : fallbackSponsors;
  const sponsorItems = useMemo(
    () => allItems.filter((item) => (item.sponsor_kind ?? "sponsor") === "sponsor"),
    [allItems]
  );
  const partnerItems = useMemo(
    () => allItems.filter((item) => item.sponsor_kind === "partner"),
    [allItems]
  );
  const displayedSponsors = sponsorItems.length ? sponsorItems : fallbackSponsors.filter((item) => item.sponsor_kind === "sponsor");
  const displayedPartners = partnerItems.length ? partnerItems : fallbackSponsors.filter((item) => item.sponsor_kind === "partner");
  const [openSponsorId, setOpenSponsorId] = useState<string | null>(null);
  const [openPartnerId, setOpenPartnerId] = useState<string | null>(null);

  return (
    <div className="sponsor-showcase">
      <section className="sponsor-logo-section" aria-labelledby="sponsor-logo-heading">
        <div className="sponsor-section-heading">
          <span>SPONSORS</span>
          <h2 id="sponsor-logo-heading">함께하는 후원사</h2>
        </div>
        <div className="sponsor-logo-grid">
          {displayedSponsors.map((sponsor) => {
            const hasCompanyLink = Boolean(sponsor.cta_url);
            const copy = parsedBody(sponsor);
            const isOpen = openSponsorId === sponsor.id;

            return (
              <article
                className="sponsor-logo-card"
                key={sponsor.id}
              >
                <button
                  aria-expanded={isOpen}
                  className="sponsor-logo-toggle"
                  onClick={() => setOpenSponsorId(isOpen ? null : sponsor.id)}
                  type="button"
                >
                  <span
                    className="sponsor-logo-mark"
                    style={sponsor.image_url ? { backgroundImage: `url(${sponsor.image_url})` } : undefined}
                  >
                    {sponsor.image_url ? null : initials(sponsor.title)}
                  </span>
                  <span className="sponsor-logo-copy">
                    <strong>{sponsor.title}</strong>
                    <small>{sponsor.subtitle || "후원사"}</small>
                  </span>
                  <ChevronDown aria-hidden className="sponsor-logo-chevron" size={21} />
                </button>

                {isOpen ? (
                  <div className="sponsor-logo-detail">
                    <div>
                      <h3>기업 소개</h3>
                      <p>{copy.description}</p>
                    </div>
                    {hasCompanyLink ? (
                      <a
                        className="sponsor-logo-link"
                        href={sponsor.cta_url ?? undefined}
                        rel="noreferrer"
                        target="_blank"
                      >
                        웹사이트 열기 <ArrowUpRight aria-hidden size={17} />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="partner-service-section" id="partners" aria-labelledby="partner-service-heading">
        <div className="sponsor-section-heading">
          <span>PARTNER BENEFITS</span>
          <h2 id="partner-service-heading">제휴 파트너 서비스</h2>
        </div>
        <div className="partner-service-grid">
          {displayedPartners.map((partner) => {
            const copy = parsedBody(partner);
            const hasServiceLink = Boolean(partner.cta_url);
            const isOpen = openPartnerId === partner.id;

            return (
              <article
                className="partner-service-card"
                key={partner.id}
              >
                <button
                  aria-expanded={isOpen}
                  className="partner-service-toggle"
                  onClick={() => setOpenPartnerId(isOpen ? null : partner.id)}
                  type="button"
                >
                  <span
                    className="partner-service-logo"
                    style={partner.image_url ? { backgroundImage: `url(${partner.image_url})` } : undefined}
                  >
                    {partner.image_url ? null : initials(partner.title)}
                  </span>
                  <span className="partner-service-copy">
                    <span className="partner-service-title-row">
                      <strong>{partner.title}</strong>
                      <ChevronDown aria-hidden className="partner-service-chevron" size={22} />
                    </span>
                    <span className="partner-service-benefits" aria-label="제휴 서비스">
                      {copy.benefits.length ? (
                        copy.benefits.slice(0, 3).map((benefit) => (
                          <span key={benefit}>
                            <Handshake aria-hidden size={17} />
                            {benefit.replace(/^[-•]\s*/, "")}
                          </span>
                        ))
                      ) : (
                        <span>
                          <Handshake aria-hidden size={17} />
                          제휴 혜택은 곧 업데이트됩니다.
                        </span>
                      )}
                    </span>
                  </span>
                </button>

                {isOpen ? (
                  <div className="partner-service-detail">
                    <div>
                      <h3>사용 방법</h3>
                      <p>{copy.usageGuide || "이용 방법은 제휴 서비스 공개 시 함께 안내됩니다."}</p>
                    </div>
                    <div>
                      <h3>기업 소개</h3>
                      <p>{copy.description}</p>
                    </div>
                    {hasServiceLink ? (
                      <a
                        className="partner-service-link"
                        href={partner.cta_url ?? undefined}
                        rel="noreferrer"
                        target="_blank"
                      >
                        서비스 페이지 열기 <ArrowUpRight aria-hidden size={17} />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
