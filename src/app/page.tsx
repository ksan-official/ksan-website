import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Facebook,
  Instagram,
  Linkedin,
  MapPinned,
  MessageCircle,
  Repeat2
} from "lucide-react";
import { HomeMotion } from "@/components/HomeMotion";
import type { SponsorEntry } from "@/components/SponsorShowcase";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const homeSections = [
  {
    Icon: BookOpen,
    href: "/guides",
    description: "도착 준비부터 행정, 집, 보험까지 필요한 정보를 모았습니다.",
    title: "정착가이드"
  },
  {
    Icon: BriefcaseBusiness,
    href: "/business",
    description: "채용, 인턴십, 기업 소식과 네트워킹 기회를 확인하세요.",
    title: "비즈니스 허브"
  },
  {
    Icon: CalendarDays,
    href: "/events",
    description: "KSAN 행사와 네덜란드 한인 학생 모임을 한곳에서 봅니다.",
    title: "행사"
  },
  {
    Icon: Repeat2,
    href: "/pass-it-on",
    description: "필요 없어진 물건을 나누고 필요한 물건을 이어받는 공간입니다.",
    title: "Pass it On"
  },
  {
    Icon: MessageCircle,
    href: "/community",
    description: "질문, 고민, 정보 공유가 자연스럽게 오가는 커뮤니티입니다.",
    title: "Community"
  },
  {
    Icon: MapPinned,
    href: "/guides#netherlands-spots",
    description: "공부하기 좋은 곳, 카페, 맛집을 지도에서 찾아보세요.",
    title: "네덜란드 스팟 지도"
  }
];

const eventSnapshots = [
  { alt: "KSAN 행사 단체 사진", src: "/images/home-events/ksan-event-1.png" },
  { alt: "KSAN 스포츠 행사 단체 사진", src: "/images/home-events/ksan-event-2.png" },
  { alt: "KSAN 모임 단체 사진", src: "/images/home-events/ksan-event-3.png" }
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

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "KS";
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
  const marqueeItems = [...visibleNetworkItems, ...visibleNetworkItems];

  return (
    <main className="page home-page" data-home-page id="main">
      <HomeMotion />
      <section className="hero-panel">
        <div className="home-hero-photo" aria-hidden />
        <div data-hero-copy>
          <h1 className="page-title max-w-6xl">
            네덜란드 생활의 모든 <span>연결.</span>
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

      <section className="home-network-section" data-motion-section>
        <div className="home-network-copy">
          <p className="eyebrow">KSAN 소개</p>
          <h2>네덜란드 전역을 잇는 한인 학생회</h2>
          <p>
            도시와 학교를 넘어 네덜란드 곳곳의 학생들이 서로 닿을 수 있는 기반을 만듭니다.
          </p>
        </div>
        <div className="home-network-map" data-map-stage aria-label="네덜란드 전역 KSAN 네트워크">
          <div className="home-map-inner">
            <Image
              alt=""
              aria-hidden
              className="home-map-netherlands"
              height={1716}
              src="/images/netherlands-network-map.png"
              width={1454}
            />
          </div>
        </div>
      </section>

      <section className="home-event-section" data-motion-section>
        <div className="home-event-copy">
          <p className="eyebrow">KSAN Events</p>
          <h2>행사와 모임으로 이어지는 학생 커뮤니티</h2>
          <p>KSAN은 네트워킹, 교류 행사, 학생 모임을 통해 낯선 도시에서도 서로 만날 수 있는 자리를 만듭니다.</p>
        </div>
        <div className="home-event-gallery" aria-label="KSAN 행사 사진">
          {eventSnapshots.map((snapshot) => (
            <Image
              alt={snapshot.alt}
              className="home-event-photo"
              height={622}
              key={snapshot.src}
              src={snapshot.src}
              width={1074}
            />
          ))}
        </div>
      </section>

      <section className="home-partner-section" data-motion-section>
        <div className="home-partner-copy">
          <p className="eyebrow">KSAN Partners</p>
          <h2>함께 만드는 학생 커뮤니티</h2>
          <p>KSAN은 다양한 협력 네트워크와 함께합니다.</p>
        </div>
        <div className="home-partner-marquee" aria-label="KSAN 협력 네트워크">
          <div className="home-partner-track">
            {marqueeItems.map((item, index) => (
              <div
                aria-label={item.title}
                className="home-partner-logo"
                key={`${item.id}-${index}`}
                style={item.image_url ? { backgroundImage: `url(${item.image_url})` } : undefined}
              >
                {item.image_url ? null : initials(item.title)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section home-section-blocks" data-motion-section id="home-sections">
        <div className="home-block-grid">
          {homeSections.map(({ Icon, description, href, title }) => (
            <Link className="home-section-block" data-motion-card href={href} key={title}>
              <span className="home-section-icon">
                <Icon aria-hidden size={24} strokeWidth={1.8} />
              </span>
              <span className="home-section-text">
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-contact-section" data-motion-section>
        <div className="home-contact-copy">
          <p className="eyebrow">Contact KSAN</p>
          <h2>궁금한 점이 있거나 함께하고 싶다면</h2>
        </div>
        <div className="home-contact-actions" data-motion-card>
          <Link className="home-contact-button" href="/about#contact">
            문의하기 <ArrowRight aria-hidden size={18} />
          </Link>
          <div className="home-social-links" aria-label="KSAN SNS">
            {socialLinks.map(({ href, Icon, label }) => (
              <a aria-label={label} href={href} key={label} rel="noreferrer" target="_blank">
                <Icon aria-hidden size={18} strokeWidth={1.9} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
