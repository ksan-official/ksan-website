import Image from "next/image";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { HomeSectionIcon } from "@/components/HomeSectionIcon";
import { AboutContactFab } from "@/components/AboutContactFab";
import { AboutContactForm } from "@/components/AboutContactForm";
import { AboutMotion } from "@/components/AboutMotion";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";
import { AboutTeamTabs } from "./AboutTeamTabs";
import styles from "./AboutPage.module.css";

export const dynamic = "force-dynamic";

type AboutEntry = {
  body: string | null;
  entry_type: "executive" | "president" | "team_member" | "sponsor";
  id: string;
  image_url: string | null;
  sort_order: number;
  subtitle: string | null;
  title: string;
};

const workItems = [
  {
    icon: "guides",
    title: "정착 정보 제공",
    text: "주거, 행정, 학교 생활처럼 처음 네덜란드에 왔을 때 필요한 정보를 학생의 언어로 정리합니다."
  },
  {
    icon: "events",
    title: "행사와 교류 기획",
    text: "도시와 학교가 달라도 자연스럽게 만날 수 있는 네트워킹, 문화, 커뮤니티 프로그램을 만듭니다."
  },
  {
    icon: "career",
    title: "커리어 기회 연결",
    text: "기업, 기관, 선배 네트워크와 협력해 학생들이 진로를 구체화할 수 있는 접점을 마련합니다."
  },
  {
    icon: "community",
    title: "학생 커뮤니티 운영",
    text: "서로의 경험이 다음 학생에게 도움이 되도록 온라인과 오프라인 커뮤니티를 꾸준히 관리합니다."
  }
] as const;

const teamGroups = [
  { key: "president", title: "회장단", summary: "학생회의 방향을 정하고 팀과 협력 기관을 연결합니다." },
  { key: "planning", title: "기획총괄", summary: "학생들이 만나고 교류할 수 있는 행사와 프로그램을 준비합니다." },
  { key: "marketing", title: "마케팅", summary: "학생회 소식과 참여 기회를 알기 쉽게 전합니다." },
  { key: "finance", title: "재무행정", summary: "예산과 행정을 관리해 학생회 활동을 뒷받침합니다." }
] as const;

type TeamKey = (typeof teamGroups)[number]["key"];

// Each framing applies only to the 4:5 card; the supplied photos stay intact.
const teamPortraits: ReadonlyArray<{
  slug: string;
  name: string;
  team: TeamKey;
  role?: string;
  position: string;
  size?: string;
}> = [
  { slug: "kang-hyunsoo", name: "강현수", team: "marketing", position: "50.5% 80%", size: "233% auto" },
  { slug: "jung-chaeyeon", name: "정채연", team: "president", role: "회장", position: "54% top" },
  { slug: "choi-ikjun", name: "최익준", team: "president", role: "부회장", position: "76% 72%", size: "132% auto" },
  { slug: "jeon-minjae", name: "전민재", team: "planning", position: "57% top", size: "188% auto" },
  { slug: "kim-ahyun", name: "김아현", team: "marketing", position: "center top" },
  { slug: "ji-yunseong", name: "지윤성", team: "finance", role: "팀장", position: "67% 88%", size: "233% auto" },
  { slug: "son-yebin", name: "손예빈", team: "planning", role: "팀장", position: "50% 86%", size: "166% auto" },
  { slug: "kang-ri", name: "강리", team: "marketing", position: "48% 74%", size: "376% auto" },
  { slug: "kim-gyurim", name: "김규림", team: "marketing", position: "71% 74%", size: "204% auto" },
  { slug: "lee-minseo", name: "이민서", team: "president", role: "부회장", position: "center top" }
];

const purposeHighlights = ["처음 정착에 필요한 정보", "학교와 도시를 넘는 교류", "선배와 만나는 진로 탐색", "기업·기관과의 협력"];

async function getTeamMembers() {
  if (!hasSupabaseConfig()) return [];

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("about_entries")
    .select("id,entry_type,title,subtitle,body,image_url,sort_order")
    .in("entry_type", ["executive", "president", "team_member"])
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load about entries", error.message);
    return [];
  }

  return (data ?? []) as AboutEntry[];
}

function groupKey(entry: AboutEntry) {
  if (entry.entry_type === "president") return "president";
  if (entry.subtitle?.includes("마케팅팀")) return "marketing";
  if (entry.subtitle?.includes("재무행정팀")) return "finance";
  if (entry.subtitle?.includes("기획총괄팀")) return "planning";
  return "planning";
}

function generationLabel(entry: AboutEntry) {
  const generation = entry.subtitle?.match(/(\d+)\s*기/)?.[1];
  return generation ? `${generation}기` : null;
}

function initials(name: string) {
  return name.trim().slice(0, 1) || "K";
}

function leadershipRank(role?: string | null) {
  const title = role?.replace(/\s/g, "");
  if (title === "회장") return 3;
  if (title === "부회장") return 2;
  if (/^(?:(?:기획총괄|마케팅|재무행정)팀?)?팀장$/.test(title ?? "")) return 2;
  if (/^(?:(?:기획총괄|마케팅|재무행정)팀?)?부팀장$/.test(title ?? "")) return 1;
  return 0;
}

export default async function AboutPage() {
  const teamMembers = await getTeamMembers();
  const nameKey = (name: string) => name.normalize("NFC").replace(/\s/g, "");
  const existingByName = new Map(teamMembers.map((member) => [nameKey(member.title), member]));
  const portraitNames = new Set(teamPortraits.map((portrait) => nameKey(portrait.name)));
  const profiles = [
    ...teamPortraits.map((portrait) => {
      const existing = existingByName.get(nameKey(portrait.name));
      return {
        id: portrait.slug,
        name: portrait.name,
        team: portrait.team,
        role: portrait.role,
        generation: existing ? generationLabel(existing) : null,
        body: existing?.body,
        photo: `/images/about-team/${portrait.slug}.webp`,
        position: portrait.position,
        size: portrait.size
      };
    }),
    ...teamMembers.filter((member) => !portraitNames.has(nameKey(member.title))).map((member) => ({
      id: member.id,
      name: member.title,
      team: groupKey(member),
      role: undefined,
      generation: generationLabel(member),
      body: member.body,
      photo: member.image_url,
      position: undefined,
      size: undefined
    }))
  ];

  return (
    <main className={`page about-page about-intro-page ${styles.page}`} data-about-page id="main">
      <AboutMotion />

      <section className={styles.hero} aria-labelledby="about-title" data-about-hero>
        <div className={styles.heroCopy} data-about-hero-copy>
          <p className={styles.eyebrow}>네덜란드 한국학생회</p>
          <h1 className="about-title" id="about-title">KSAN 소개</h1>
          <p className="about-intro-line">
            네덜란드 한인 유학생을 연결하는 학생 커뮤니티입니다. 처음 정착하는 날부터 진로를 고민하는 순간까지, 먼저 겪어본 사람의 경험을 나누고 함께할 사람을 만나는 자리를 만듭니다.
          </p>
          <div className={styles.heroActions}>
            <a href="#about-work">활동 보기 <ArrowDown aria-hidden size={16} /></a>
            <a href="#contact">협업 문의 <ArrowRight aria-hidden size={16} /></a>
          </div>
          <ul className={styles.stats} aria-label="숫자로 보는 KSAN과 네덜란드 유학">
            <li>
              <strong>970<small>명</small></strong>
              <span>네덜란드 내 한국 국적 유학생</span>
            </li>
            <li>
              <strong>15<small>년</small></strong>
              <span>KSAN 활동 기간</span>
            </li>
            <li>
              <strong>6<small>회</small></strong>
              <span>KSAN 체육대회</span>
            </li>
          </ul>
        </div>
        <div className={`${styles.photo} ${styles.heroPhoto}`} data-about-visual>
          <Image
            alt="KSAN 체육대회에서 함께 공을 전달하는 학생들"
            fill
            preload
            sizes="(max-width: 720px) calc(100vw - 80px), (max-width: 1440px) 46vw, 670px"
            src="/images/home-network-students.jpg"
          />
        </div>
      </section>

      <section className={`about-purpose ${styles.purpose}`} aria-labelledby="about-purpose-title" data-about-section>
        <div className="about-purpose-text">
          <div>
            <span className={styles.eyebrow}>설립목적</span>
            <h2 id="about-purpose-title">낯선 곳에서도 혼자가 아니도록</h2>
          </div>
          <p>
            KSAN(Korean Student Association Netherlands)은 네덜란드에 거주하는 한국인 유학생과 청년들을
            연결하는 커뮤니티입니다.{" "}
            학업, 생활, 진로에 필요한 정보와 다양한 교류의 기회를 제공하며, 서로가 안정적으로 정착하고
            성장할 수 있는 환경을 만들어가고 있습니다.
          </p>
          <p>
            또한 기업, 기관과의 협력을 통해 학생과 사회를 연결하는 가교 역할을 하며, 한국과 네덜란드를
            잇는 건강한 한인 네트워크를 만들어가고 있습니다.
          </p>
          <ul className={styles.purposeHighlights}>
            {purposeHighlights.map((item) => <li key={item}><Check aria-hidden size={16} />{item}</li>)}
          </ul>
        </div>
        <div className={`${styles.photo} ${styles.purposePhoto}`}>
          <Image
            alt="2026 KSAN 신입생 네트워킹에 모인 학생들"
            fill
            sizes="(max-width: 720px) calc(100vw - 32px), (max-width: 1200px) 46vw, 550px"
            src="/images/home-events/ksan-event-1.png"
          />
        </div>
      </section>

      <section className={`about-work ${styles.work}`} data-about-section id="about-work">
        <div className={`about-section-heading compact ${styles.workHeading}`}>
          <h2>KSAN이 하는 일</h2>
          <p>집을 구할 때 필요한 정보부터 새 친구를 만나는 행사, 졸업 후의 진로까지. 학생들이 실제로 필요로 하는 정보, 사람, 기회를 연결합니다.</p>
        </div>
        <div className="about-work-grid" data-activity-grid>
          {workItems.map((item) => (
            <article className="about-work-card" data-activity-card key={item.title}>
              <span>
                <HomeSectionIcon kind={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-team" data-about-section>
        <div className="about-section-heading compact">
          <h2>운영진 소개</h2>
          <p>행사를 준비하고, 소식을 전하고, 운영을 뒷받침하는 팀이 함께 KSAN을 만들어갑니다.</p>
        </div>
        <AboutTeamTabs panels={teamGroups.map((group) => {
          const members = profiles
            .filter((profile) => profile.team === group.key)
            .sort((a, b) => leadershipRank(b.role ?? b.body) - leadershipRank(a.role ?? a.body));
          return {
            id: group.key,
            label: group.title,
            content: (
              <>
                <p className={styles.teamSummary}>{group.summary}</p>
                {members.length ? (
                  <div className="about-people-grid">
                    {members.map((member) => (
                        <article className="about-person-card" key={member.id}>
                          <div
                            className="about-person-photo"
                            aria-hidden="true"
                            style={member.photo ? {
                              backgroundImage: `url("${member.photo}")`,
                              backgroundPosition: member.position,
                              backgroundSize: member.size,
                              backgroundRepeat: "no-repeat"
                            } : undefined}
                          >
                            {member.photo ? null : initials(member.name)}
                          </div>
                          <strong>{member.name}</strong>
                          {member.role ? <span>{member.role}</span> : null}
                          {member.generation ? <span>{member.generation}</span> : null}
                          {member.body ? <small>{member.body}</small> : null}
                        </article>
                    ))}
                  </div>
                ) : null}
              </>
            )
          };
        })} />
      </section>

      <section className="about-contact" data-about-section id="contact">
        <div className="about-contact-copy">
          <p className="eyebrow">Partnership &amp; Collaboration</p>
          <h2>KSAN과 함께, 오래 남는 연결을 만드세요.</h2>
          <p>
            학생을 위한 후원, 브랜드 협업, 커리어 프로그램, 문화 프로젝트를 언제든 환영합니다.
            서로의 강점을 연결해 학생과 파트너 모두에게 의미 있는 경험을 제안해 주세요.
          </p>
          <div className="about-contact-topics" aria-label="주요 협업 분야">
            <span>후원·파트너십</span>
            <span>행사 공동 기획</span>
            <span>채용·커리어</span>
          </div>
        </div>
        <AboutContactForm />
      </section>

      <AboutContactFab />
    </main>
  );
}
