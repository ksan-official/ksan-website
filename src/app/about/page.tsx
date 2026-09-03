import { BriefcaseBusiness, CalendarDays, MapPinned, UsersRound } from "lucide-react";
import { AboutContactFab } from "@/components/AboutContactFab";
import { AboutContactForm } from "@/components/AboutContactForm";
import { AboutMotion } from "@/components/AboutMotion";
import { createServerSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

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
    icon: MapPinned,
    title: "정착 정보 제공",
    text: "주거, 행정, 학교 생활처럼 처음 네덜란드에 왔을 때 필요한 정보를 학생의 언어로 정리합니다."
  },
  {
    icon: CalendarDays,
    title: "행사와 교류 기획",
    text: "도시와 학교가 달라도 자연스럽게 만날 수 있는 네트워킹, 문화, 커뮤니티 프로그램을 만듭니다."
  },
  {
    icon: BriefcaseBusiness,
    title: "커리어 기회 연결",
    text: "기업, 기관, 선배 네트워크와 협력해 학생들이 진로를 구체화할 수 있는 접점을 마련합니다."
  },
  {
    icon: UsersRound,
    title: "학생 커뮤니티 운영",
    text: "서로의 경험이 다음 학생에게 도움이 되도록 온라인과 오프라인 커뮤니티를 꾸준히 관리합니다."
  }
];

const teamGroups = [
  { key: "president", title: "회장단" },
  { key: "planning", title: "기획총괄팀" },
  { key: "marketing", title: "마케팅팀" },
  { key: "finance", title: "재무행정팀" }
];

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

export default async function AboutPage() {
  const teamMembers = await getTeamMembers();

  return (
    <main className="page about-page about-intro-page" data-about-page id="main">
      <AboutMotion />

      <section className="about-hero about-intro-hero" data-about-hero>
        <div className="about-hero-copy" data-about-hero-copy>
          <h1 className="about-title">KSAN 소개</h1>
          <p className="about-intro-line">
            <strong>네덜란드 한인 유학생을 연결하는 학생 커뮤니티, KSAN</strong>
          </p>
        </div>
      </section>

      <section className="about-purpose" data-about-section>
        <div className="about-purpose-heading">
          <h2>설립목적</h2>
        </div>
        <div className="about-purpose-text">
          <p>
            KSAN(Korean Student Association Netherlands)은 네덜란드에 거주하는 한국인 유학생과 청년들을
            연결하는 커뮤니티입니다.
          </p>
          <p>
            학업, 생활, 진로에 필요한 정보와 다양한 교류의 기회를 제공하며, 서로가 안정적으로 정착하고
            성장할 수 있는 환경을 만들어가고 있습니다.
          </p>
          <p>
            또한 기업, 기관과의 협력을 통해 학생과 사회를 연결하는 가교 역할을 하며, 한국과 네덜란드를
            잇는 건강한 한인 네트워크를 만들어가고 있습니다.
          </p>
        </div>
      </section>

      <section className="about-work" data-about-section>
        <div className="about-section-heading compact">
          <h2>KSAN이 하는 일</h2>
          <p>학생들이 실제로 필요로 하는 정보, 사람, 기회를 연결합니다.</p>
        </div>
        <div className="about-work-grid" data-activity-grid>
          {workItems.map((item) => {
            const Icon = item.icon;
            return (
              <article className="about-work-card" data-activity-card key={item.title}>
                <span>
                  <Icon aria-hidden size={22} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-team" data-about-section>
        <div className="about-section-heading compact">
          <h2>운영진 소개</h2>
        </div>
        {teamMembers.length ? (
          <div className="about-people-sections">
            {teamGroups.map((group) => {
              const members = teamMembers.filter((member) => groupKey(member) === group.key);
              if (!members.length) return null;

              return (
                <section className="about-people-group" key={group.key}>
                  <h3>{group.title}</h3>
                  <div className="about-people-grid">
                    {members.map((member) => {
                      const generation = generationLabel(member);

                      return (
                        <article className="about-person-card" data-story-card key={member.id}>
                          <div
                            className="about-person-photo"
                            style={member.image_url ? { backgroundImage: `url(${member.image_url})` } : undefined}
                          >
                            {member.image_url ? null : initials(member.title)}
                          </div>
                          <strong>{member.title}</strong>
                          {generation ? <span>{generation}</span> : null}
                          {member.body ? <small>{member.body}</small> : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="about-people-empty">
            <strong>운영진 정보를 준비 중입니다.</strong>
          </div>
        )}
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
