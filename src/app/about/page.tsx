import { ArrowRight, Handshake, Mail } from "lucide-react";
import { AboutActivityGrid } from "@/components/AboutActivityGrid";
import { AboutContactFab } from "@/components/AboutContactFab";
import { AboutMotion } from "@/components/AboutMotion";

const activities = [
  {
    area: "orientation",
    title: "새내기 오리엔테이션",
    summary: "첫 연결",
    description:
      "네덜란드 생활의 첫 주를 덜 낯설게 만드는 자리입니다. 학교와 도시, 행정과 생활 정보를 나누고 함께 시작할 동료를 만납니다.",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85"
  },
  {
    area: "career",
    title: "커리어 & 인사이트",
    summary: "다음 기회",
    description:
      "현지 기업과 선배의 경험을 학생의 언어로 연결합니다. 커리어 토크, 실무 세션, 채용 정보를 통해 다음 선택을 구체화합니다.",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85"
  },
  {
    area: "network",
    title: "학생 네트워킹",
    summary: "사람과 사람",
    description:
      "학교와 전공, 도시가 달라도 편하게 만날 수 있는 커뮤니티 프로그램입니다. 새로운 친구와 협업의 시작점을 만듭니다.",
    image:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=85"
  },
  {
    area: "guide",
    title: "정착 정보 프로젝트",
    summary: "경험의 공유",
    description:
      "BSN, 주거, 보험, 은행처럼 먼저 경험한 학생의 정보가 다음 학생에게 정확히 이어지도록 실용적인 가이드를 만듭니다.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85"
  },
  {
    area: "culture",
    title: "문화 교류 프로그램",
    summary: "함께 즐기는 시간",
    description:
      "한국과 네덜란드의 문화를 매개로 학생과 지역 커뮤니티가 자연스럽게 가까워지는 경험을 기획합니다.",
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1400&q=85"
  }
];

const partners = [
  ["UN", "University Network"],
  ["SU", "Student Union"],
  ["CP", "Career Partner"],
  ["CC", "Culture Collective"],
  ["CM", "Community Partner"],
  ["PP", "Public Partner"]
];

export default function AboutPage() {
  return (
    <main className="page about-page" data-about-page id="main">
      <AboutMotion />

      <section className="about-hero" data-about-hero>
        <div className="about-hero-copy" data-about-hero-copy>
          <p className="eyebrow">KSAN · 네덜란드 한인 학생회</p>
          <h1 className="about-title max-w-6xl">낯선 시작을, 함께 만드는 연결로.</h1>
          <p className="about-mission">
            KSAN은 네덜란드에서 공부하는 한국 학생들이 필요한 정보를 찾고, 서로를 만나며,
            다음 기회를 함께 만들 수 있도록 연결하는 학생 커뮤니티입니다.
          </p>
        </div>
        <div className="about-hero-visual" data-about-visual role="img" aria-label="함께 이야기하는 학생들">
          <span>Information</span>
          <span>Community</span>
          <span>Opportunity</span>
        </div>
      </section>

      <section className="about-story" data-about-section data-about-story>
        <div className="about-story-intro" data-story-intro>
          <p className="eyebrow">우리의 시작과 역할</p>
          <h2>학생의 경험이 다음 학생의 길이 되도록</h2>
          <p>
            한 사람의 시행착오가 모두의 정보가 되고, 한 번의 만남이 오래 이어지는 관계가 되도록
            KSAN은 학생에게 필요한 연결을 설계합니다.
          </p>
        </div>
        <div className="about-story-cards">
          <article className="about-story-card start-card" data-story-card>
            <span>2026 · 새로운 연결의 시작</span>
            <h3>네덜란드 전역을 잇는 학생 네트워크</h3>
            <p>
              도시와 학교의 경계를 넘어 학생들이 서로의 정보와 경험을 나누는 커뮤니티를 만들어가고
              있습니다.
            </p>
          </article>
          <article className="about-story-card" data-story-card>
            <span>우리가 하는 일</span>
            <h3>정보를 정리하고, 사람을 연결하고, 기회를 확장합니다.</h3>
            <ul>
              <li>네덜란드 생활과 정착을 위한 실용 정보</li>
              <li>학생 간 교류를 만드는 행사와 커뮤니티</li>
              <li>기업·기관과 함께 여는 커리어 및 협업 기회</li>
            </ul>
          </article>
          <article className="about-story-card blue-card" data-story-card>
            <span>우리의 방식</span>
            <h3>학생에게 가깝게, 운영은 책임감 있게</h3>
            <p>
              편하게 다가올 수 있는 커뮤니티의 온도와, 정확한 정보를 제공하는 조직의 전문성을 함께
              지향합니다.
            </p>
          </article>
        </div>
      </section>

      <section className="about-activities" data-about-section>
        <div className="about-section-heading">
          <div>
            <p className="eyebrow">우리가 만드는 경험</p>
            <h2>학생 생활의 중요한 순간마다</h2>
          </div>
          <p>카드를 눌러 각 활동이 만드는 연결을 확인해 보세요.</p>
        </div>
        <AboutActivityGrid activities={activities} />
      </section>

      <section className="about-partners" data-about-section>
        <div className="about-partners-copy">
          <p className="eyebrow">함께 만드는 임팩트</p>
          <h2>뜻을 모은 파트너와, 더 멀리 연결합니다.</h2>
          <p>
            대학, 학생 조직, 기업, 문화 기관이 KSAN의 활동을 함께 지원하며 학생에게 더 넓은 경험과
            기회를 전합니다.
          </p>
        </div>
        <div className="partner-marquee" aria-label="협력 파트너 로고 영역">
          <div className="partner-track">
            {[0, 1].map((group) => (
              <div className="partner-group" aria-hidden={group === 1} key={group}>
                {partners.map(([mark, name]) => (
                  <div className="partner-logo" key={`${group}-${name}`}>
                    <span>{mark}</span>
                    <strong>{name}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="partner-note">확정된 협력사 로고로 교체할 수 있도록 준비된 영역입니다.</p>
      </section>

      <section className="about-contact" data-about-section id="contact">
        <div className="about-contact-copy">
          <p className="eyebrow">Partnership & Collaboration</p>
          <h2>KSAN과 함께, 오래 남는 연결을 만드세요.</h2>
          <p>
            학생을 위한 후원, 브랜드 협업, 커리어 프로그램, 문화 프로젝트를 언제든 환영합니다.
            서로의 강점을 연결해 학생과 파트너 모두에게 의미 있는 경험을 제안해 주세요.
          </p>
          <div className="about-contact-actions">
            <a className="button" href="#contact-details">
              협업 방식 확인하기 <ArrowRight size={18} aria-hidden />
            </a>
          </div>
        </div>
        <div className="about-contact-panel" id="contact-details">
          <div>
            <Handshake size={22} aria-hidden />
            <span>후원 및 파트너십</span>
            <strong>프로그램 공동 기획 · 학생 대상 캠페인 · 행사 후원</strong>
          </div>
          <div>
            <Mail size={22} aria-hidden />
            <span>공식 문의 채널</span>
            <strong>hello@ksan.nl</strong>
            <small>공식 이메일 주소 확정 후 연결 예정</small>
          </div>
        </div>
      </section>

      <AboutContactFab />
    </main>
  );
}
