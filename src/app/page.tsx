import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin
} from "lucide-react";
import { HomeMotion } from "@/components/HomeMotion";
import { HomeEventGallery } from "@/components/HomeEventGallery";
import { HomeSectionIcon } from "@/components/HomeSectionIcon";
import type { SponsorEntry } from "@/components/SponsorShowcase";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const homeSections = [
  {
    icon: "guides" as const,
    href: "/guides",
    description: "도착 준비부터 행정, 집, 보험까지 필요한 정보를 모았습니다.",
    title: "정착가이드"
  },
  {
    icon: "career" as const,
    href: "/business",
    description: "채용, 인턴십, 기업 소식과 네트워킹 기회를 확인하세요.",
    title: "커리어 허브"
  },
  {
    icon: "events" as const,
    href: "/events",
    description: "KSAN 행사와 네덜란드 한인 학생 모임을 한곳에서 봅니다.",
    title: "행사"
  },
  {
    icon: "market" as const,
    href: "/pass-it-on",
    description: "필요 없어진 물건을 나누고 필요한 물건을 이어받는 공간입니다.",
    title: "중고거래"
  },
  {
    icon: "community" as const,
    href: "/community",
    description: "질문, 고민, 정보 공유가 자연스럽게 오가는 KSAN 커뮤니티입니다.",
    title: "케이숲"
  },
  {
    icon: "map" as const,
    href: "/guides#netherlands-spots",
    description: "공부하기 좋은 곳, 카페, 맛집을 지도에서 찾아보세요.",
    title: "네덜란드 스팟 지도"
  }
];

const eventSnapshots = [
  { alt: "2026 신입생 네트워킹 단체 사진", src: "/images/home-events/ksan-event-1.png", title: "2026 신입생 네트워킹" },
  { alt: "제6회 KSAN 체육대회 단체 사진", src: "/images/home-events/ksan-event-2.png", title: "제6회 KSAN 체육대회" },
  { alt: "2025 신입생 네트워킹 단체 사진", src: "/images/home-events/ksan-event-3.png", title: "2025 신입생 네트워킹" }
];

const socialLinks = [
  { href: "https://www.instagram.com/ksan.nl/", Icon: Instagram, label: "Instagram" },
  { href: "https://www.facebook.com/ksan.nl", Icon: Facebook, label: "Facebook" },
  { href: "https://www.linkedin.com/company/korean-students-association-in-the-netherlands-ksan-", Icon: Linkedin, label: "LinkedIn" }
];

const institutionalPartners = [
  {
    id: "korned",
    title: "네덜란드 한인회",
    subtitle: "협력 네트워크",
    image_url: "/images/partners/korned.png",
    sponsor_kind: "partner"
  },
  {
    id: "korean-embassy",
    title: "대사관",
    subtitle: "공공 협력",
    image_url: "/images/partners/korean-embassy.png",
    sponsor_kind: "partner"
  },
  {
    id: "yi-jun-peace-museum",
    title: "이준열사기념관",
    subtitle: "협력 네트워크",
    image_url: "/images/partners/yi-jun-peace-museum.png",
    sponsor_kind: "partner"
  },
  {
    id: "korean-chamber-commerce",
    title: "네덜란드 한인상공회의소",
    subtitle: "협력 네트워크",
    image_url: "/images/partners/korean-chamber-commerce.png",
    sponsor_kind: "partner"
  }
];

const featuredLandingSponsors = [
  {
    id: "boko",
    title: "BOKO International",
    subtitle: "후원사",
    image_url: "/images/partners/boko.png",
    sponsor_kind: "sponsor"
  },
  {
    id: "nordvpn",
    title: "NordVPN",
    subtitle: "후원사",
    image_url: "/images/partners/nordvpn.png",
    sponsor_kind: "sponsor"
  },
  {
    id: "utransfer",
    title: "Utransfer",
    subtitle: "후원사",
    image_url: "/images/partners/utransfer.png",
    sponsor_kind: "sponsor"
  },
  {
    id: "bunq",
    title: "bunq",
    subtitle: "후원사",
    image_url: "/images/partners/bunq.png",
    sponsor_kind: "sponsor"
  }
];

const landingSponsorLogoOverrides = [
  { keyword: "boko", image_url: "/images/partners/boko.png" },
  { keyword: "nordvpn", image_url: "/images/partners/nordvpn.png" },
  { keyword: "utransfer", image_url: "/images/partners/utransfer.png" },
  { keyword: "bunq", image_url: "/images/partners/bunq.png" }
];

async function getLandingSponsors() {
  if (!hasSupabaseConfig()) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("about_entries")
    .select("id,title,subtitle,image_url,sponsor_kind")
    .eq("entry_type", "sponsor")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load landing sponsor entries", error.message);
    return [];
  }

  return (data ?? []) as Pick<SponsorEntry, "id" | "image_url" | "sponsor_kind" | "subtitle" | "title">[];
}

function withLandingLogoOverride<T extends Pick<SponsorEntry, "image_url" | "title">>(item: T) {
  const normalizedTitle = item.title.toLowerCase();
  const override = landingSponsorLogoOverrides.find(({ keyword }) => normalizedTitle.includes(keyword));

  return override ? { ...item, image_url: override.image_url } : item;
}

function partnerKey(item: Pick<SponsorEntry, "title">) {
  return item.title.toLowerCase().replace(/\s+/g, "");
}

function uniquePartners<T extends Pick<SponsorEntry, "title">>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = partnerKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function HomePage() {
  const sponsorItems = (await getLandingSponsors()).map(withLandingLogoOverride);
  const networkItems = uniquePartners([...institutionalPartners, ...featuredLandingSponsors, ...sponsorItems]);
  const visibleNetworkItems = networkItems.length
    ? networkItems
    : [
        { id: "sponsor-placeholder-1", title: "후원사", subtitle: "Partner", image_url: null, sponsor_kind: "sponsor" },
        { id: "sponsor-placeholder-2", title: "협력사", subtitle: "Partner", image_url: null, sponsor_kind: "sponsor" },
        ...institutionalPartners
      ];

  return (
    <main className="page home-page" data-home-page id="main">
      <HomeMotion />
      <section className="hero-panel">
        <div className="home-hero-photo" aria-hidden />
        <div data-hero-copy>
          <h1 className="page-title max-w-6xl">
            네덜란드 생활의<br />
            모든&nbsp;<span>연결.</span>
          </h1>
          <p className="home-hero-copy">
            비즈니스 네트워킹부터 중고 나눔, 고민 상담까지.
            <br />
            네덜란드 한인 유학생의 모든 것, 한 번에.
          </p>
          <div className="hero-actions">
            <Link className="button" href="#home-sections">
              둘러보기 <ArrowDown aria-hidden size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-services-section" data-services-section id="home-sections" aria-labelledby="home-services-title">
        <div className="home-services-heading">
          <h2 id="home-services-title">우리의 네덜란드 생활,<br />여기서 연결돼요.</h2>
          <p>처음의 설렘부터 매일의 발견까지, KSAN과 함께.</p>
        </div>
        <div className="home-services-viewport" data-services-viewport>
        <div className="home-block-grid" data-services-track>
          {homeSections.map(({ icon, description, href, title }) => (
            <Link className="home-section-block" data-motion-card href={href} key={title}>
              <span aria-hidden="true" className="home-section-icon">
                <HomeSectionIcon kind={icon} />
              </span>
              <span className="home-section-text">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <span aria-hidden="true" className="home-section-cta">
                <ArrowRight size={18} strokeWidth={1.8} />
              </span>
            </Link>
          ))}
        </div>
        </div>
        <div className="home-services-navigation">
          <div aria-hidden="true" className="home-services-progress"><span data-services-progress /></div>
        </div>
      </section>

      <section className="home-network-section" data-motion-section aria-labelledby="home-network-title">
        <div className="home-network-banner">
          <Image
            alt="KSAN 체육대회에서 함께 공을 전달하는 학생들"
            className="home-network-photo"
            data-network-photo
            fill
            sizes="(max-width: 1240px) 100vw, 1200px"
            src="/images/home-network-students.jpg"
          />
          <div className="home-network-shade" aria-hidden="true" />
          <div className="home-network-copy">
            <h2 id="home-network-title">네덜란드 전역을 잇는<br />한인 학생회</h2>
            <p>
              도시와 학교를 넘어 네덜란드 곳곳의 학생들이 서로 닿을 수 있는 기반을 만듭니다.
            </p>
            <Link className="home-network-link" href="/about">
              KSAN 알아보기 <ArrowRight aria-hidden="true" size={18} strokeWidth={1.7} />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-event-section" data-motion-section>
        <div className="home-event-copy">
          <h2>행사와 모임으로 이어지는 학생 커뮤니티</h2>
          <p>KSAN은 네트워킹, 교류 행사, 학생 모임을 통해 낯선 도시에서도 서로 만날 수 있는 자리를 만듭니다.</p>
        </div>
        <HomeEventGallery snapshots={eventSnapshots} />
      </section>

      <section className="home-partner-section home-partner-reference" data-motion-section aria-labelledby="home-partner-title">
        <div className="home-partner-copy">
          <p className="eyebrow">KSAN Partners</p>
          <h2 id="home-partner-title">함께 만드는<br />학생 커뮤니티</h2>
          <p>다양한 기업과 기관이 KSAN과 함께<br />네덜란드 한인 학생들의 연결을 넓혀갑니다.</p>
          <div className="home-partner-inquiry">
            <p>협업과 후원에 관심이 있으신가요?</p>
            <Link className="home-contact-button" href="/about#contact">
              협업 문의하기 <ArrowRight aria-hidden size={18} />
            </Link>
            <div className="home-social-links" aria-label="KSAN SNS">
              {socialLinks.map(({ href, Icon, label }) => (
                <a aria-label={label} href={href} key={label} rel="noreferrer" target="_blank">
                  <Icon aria-hidden size={17} strokeWidth={1.7} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <ul className="home-partner-grid" aria-label="KSAN과 함께하는 기업 및 기관">
          {visibleNetworkItems.map((item) => (
            <li className="home-partner-grid-logo" key={item.id}>
              {item.image_url ? (
                <Image alt={item.title} height={88} src={item.image_url} width={200} />
              ) : <span>{item.title}</span>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
