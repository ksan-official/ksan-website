import Link from "next/link";
import { Bell, ChevronDown, HandHeart, MapPin, Repeat2, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { MarketPreviewMotion } from "@/components/MarketPreviewMotion";

const marketItems = [
  { city: "Amsterdam", condition: "상태 좋아요", image: "/images/market-preview/bicycle.jpg", price: "€ 85", title: "학생용 자전거" },
  { city: "Rotterdam", condition: "거의 새것", image: "/images/market-preview/desk-lamp.jpg", price: "€ 18", title: "오렌지 책상 조명" },
  { city: "Leiden", condition: "묶음 판매", image: "/images/market-preview/textbooks.jpg", price: "€ 24", title: "전공 교재 세트" },
  { city: "Delft", condition: "깨끗해요", image: "/images/market-preview/rice-cooker.jpg", price: "€ 32", title: "1인용 미니 밥솥" },
  { city: "Utrecht", condition: "사용감 적어요", image: "/images/market-preview/nightstand.jpg", price: "€ 28", title: "원목 협탁" },
  { city: "Den Haag", condition: "직접 픽업", image: "/images/market-preview/desk-lamp.jpg", price: "€ 15", title: "생활용품 꾸러미" }
];

const marketCategories = [
  "전체 상품",
  "생활용품",
  "가구",
  "전자기기",
  "교재 · 책",
  "자전거",
  "주방용품",
  "의류",
  "무료 나눔"
];

export default function PassItOnPage() {
  return (
    <main className="page coming-soon-page coming-soon-page--market" data-market-page>
      <MarketPreviewMotion />
      <section className="coming-soon-hero market-coming-hero" aria-labelledby="pass-it-on-title" data-market-hero>
        <div className="coming-soon-copy">
          <span className="coming-soon-kicker">COMING SOON · 곧 오픈 예정</span>
          <h1 className="coming-soon-title" id="pass-it-on-title">
            <span>학생들을 위한 가장 가까운</span>
            <strong>중고거래의 새로운 시작</strong>
          </h1>
          <p className="coming-soon-lead">
            불필요한 걱정 없이, 네덜란드 한인 학생끼리 믿고 거래할 수 있는 공간이 곧 찾아옵니다.
          </p>
          <div className="coming-soon-actions">
            <Link className="coming-soon-primary" href="/auth">
              <Bell aria-hidden size={17} />
              오픈 알림 받기
            </Link>
          </div>
        </div>

        <div className="market-feature-list" aria-label="중고거래 예정 기능">
          <span><Search aria-hidden size={19} /> 도시별 물건 찾기</span>
          <span><HandHeart aria-hidden size={19} /> 판매와 무료 나눔</span>
          <span><ShieldCheck aria-hidden size={19} /> 회원 기반 안심 거래</span>
          <span><Repeat2 aria-hidden size={19} /> 필요한 사람에게 이어주기</span>
        </div>
      </section>

      <section className="market-gated-preview" aria-label="중고거래 화면 미리보기">
        <div className="market-preview-ui" aria-hidden="true">
          <div className="market-catalog-topbar">
            <span className="market-filter-toggle"><SlidersHorizontal size={14} /> 필터 숨기기</span>
            <div className="market-catalog-summary">
              <span>전체 48개 상품</span>
              <span className="market-sort-control">추천순 <ChevronDown size={14} /></span>
            </div>
          </div>
          <div className="market-catalog-layout">
            <aside className="market-filter-sidebar">
              <div className="market-filter-price">
                <strong>가격</strong>
                <div className="market-price-range"><i /><i /></div>
                <span>€0 — €250</span>
              </div>
              <div className="market-filter-categories">
                <strong>카테고리</strong>
                {marketCategories.map((category, index) => (
                  <span className={index === 0 ? "active" : undefined} key={category}>{category}</span>
                ))}
              </div>
            </aside>
            <div className="market-product-grid">
              {marketItems.map((item) => (
                <article className="market-product-card" data-market-card key={item.title}>
                  <div className="market-product-image" style={{ backgroundImage: `url(${item.image})` }} />
                  <div className="market-product-info">
                    <span className="market-product-city"><MapPin aria-hidden size={13} /> {item.city}</span>
                    <h3>{item.title}</h3>
                    <p>{item.condition}</p>
                    <strong>{item.price}</strong>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
