import Link from "next/link";
import { ArrowRight, Bell, HandHeart, Repeat2, ShieldCheck } from "lucide-react";

export default function PassItOnPage() {
  return (
    <main className="page coming-soon-page coming-soon-page--market">
      <section className="coming-soon-hero" aria-labelledby="pass-it-on-title">
        <div className="coming-soon-copy">
          <span className="coming-soon-kicker">KSAN MARKET</span>
          <h1 className="coming-soon-title" id="pass-it-on-title">중고거래</h1>
          <p className="coming-soon-lead">
            새 학기마다 필요한 물건을 더 쉽게 넘기고 받을 수 있도록 준비하고 있어요.
          </p>
          <div className="coming-soon-actions">
            <Link className="coming-soon-primary" href="/auth">
              오픈 알림 받기
              <ArrowRight aria-hidden size={18} />
            </Link>
            <Link className="coming-soon-secondary" href="/events">
              행사 먼저 보기
            </Link>
          </div>
        </div>

        <div className="coming-soon-preview" aria-label="중고거래 미리보기">
          <div className="market-preview-card market-preview-card--featured">
            <span className="market-preview-badge">곧 열려요</span>
            <strong>책상 조명 · 자전거 · 교재</strong>
            <p>도시별로 필요한 물건을 찾고, KSAN 회원끼리 안전하게 연결됩니다.</p>
          </div>
          <div className="market-preview-list">
            <span><Repeat2 aria-hidden size={18} /> 필요한 물건 이어받기</span>
            <span><HandHeart aria-hidden size={18} /> 무료 나눔 등록</span>
            <span><ShieldCheck aria-hidden size={18} /> 회원 기반 거래</span>
            <span><Bell aria-hidden size={18} /> 오픈 알림</span>
          </div>
        </div>
      </section>
    </main>
  );
}
