export type JobType = "풀타임" | "워킹 스튜던트" | "파트타임" | "인턴" | "계약직";

export type BusinessJob = {
  accent: "orange" | "blue" | "dark";
  applyTarget: string;
  company: string;
  deadline: string | null;
  department: string;
  description: string;
  companyIntro: string;
  responsibilities: string;
  requirements: string;
  featured?: boolean;
  id: string;
  location: string;
  tags: string[];
  title: string;
  type: JobType;
};

type BusinessDetailInput = {
  companyIntro?: string | null;
  description: string;
  requirements?: string | null;
  responsibilities?: string | null;
};

type ParsedBusinessDetails = {
  companyIntro: string;
  requirements: string;
  responsibilities: string;
  summary: string;
};

const businessDetailHeadings = {
  companyIntro: "회사 소개",
  requirements: "자격 요건",
  responsibilities: "주요 업무"
} as const;

function present(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function composeBusinessDetailText(input: BusinessDetailInput) {
  const sections = [
    [businessDetailHeadings.companyIntro, input.companyIntro],
    [businessDetailHeadings.responsibilities, input.responsibilities],
    [businessDetailHeadings.requirements, input.requirements]
  ];
  const sectionText = sections
    .map(([heading, value]) => present(value) ? `${heading}\n${present(value)}` : "")
    .filter(Boolean)
    .join("\n\n");
  return [present(input.description), sectionText].filter(Boolean).join("\n\n");
}

export function resolveBusinessDetails(input: BusinessDetailInput): ParsedBusinessDetails {
  const parsed: ParsedBusinessDetails = {
    companyIntro: "",
    requirements: "",
    responsibilities: "",
    summary: present(input.description)
  };
  let active: keyof Omit<ParsedBusinessDetails, "summary"> | "summary" = "summary";
  const summaryLines: string[] = [];
  const buckets = {
    companyIntro: [] as string[],
    requirements: [] as string[],
    responsibilities: [] as string[]
  };

  present(input.description).split(/\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    const normalized = line.replace(/[:：]+$/, "");
    if (normalized === businessDetailHeadings.companyIntro) {
      active = "companyIntro";
      return;
    }
    if (normalized === businessDetailHeadings.responsibilities) {
      active = "responsibilities";
      return;
    }
    if (normalized === businessDetailHeadings.requirements) {
      active = "requirements";
      return;
    }
    if (normalized === "지원하기") {
      active = "summary";
      return;
    }
    if (!line) return;
    if (active === "summary") summaryLines.push(line);
    else buckets[active].push(line.replace(/^[-*•]\s*/, ""));
  });

  parsed.summary = summaryLines[0] ?? parsed.summary;
  parsed.companyIntro = present(input.companyIntro) || buckets.companyIntro.join("\n") || parsed.summary;
  parsed.responsibilities = present(input.responsibilities) || buckets.responsibilities.join("\n") || parsed.summary;
  parsed.requirements = present(input.requirements) || buckets.requirements.join("\n") || "지원 전 회사와 포지션 정보를 확인한 뒤, 본인의 경험과 관심사를 중심으로 지원서를 준비해주세요.";
  return parsed;
}

export const businessJobs: BusinessJob[] = [
  {
    accent: "orange",
    applyTarget: "mailto:careers@example.com",
    company: "Northstar Mobility",
    deadline: "2026-09-18",
    department: "Marketing",
    description: "유럽 시장을 대상으로 브랜드 캠페인과 커뮤니티 콘텐츠 운영을 함께합니다.",
    companyIntro: "Northstar Mobility는 네덜란드와 한국을 잇는 모빌리티 브랜드입니다. 현지 학생 커뮤니티와 함께 유럽 시장에서 브랜드 인지도를 넓히고 있습니다.",
    responsibilities: "브랜드 캠페인 아이디어 리서치\nSNS 및 커뮤니티 콘텐츠 캘린더 운영\n학생 대상 오프라인 프로모션 준비\n캠페인 성과 정리와 간단한 리포트 작성",
    requirements: "영어로 기본적인 업무 커뮤니케이션이 가능한 분\n콘텐츠, 브랜딩, 커뮤니티 운영에 관심 있는 분\nAmsterdam 또는 Randstad 지역에서 일부 오프라인 활동이 가능한 분",
    featured: true,
    id: "northstar-marketing-intern",
    location: "Amsterdam",
    tags: ["영어 가능", "브랜드", "커뮤니티"],
    title: "Growth Marketing Intern",
    type: "인턴"
  },
  {
    accent: "blue",
    applyTarget: "mailto:careers@example.com",
    company: "Canal Labs",
    deadline: "2026-09-28",
    department: "Product",
    description: "학생 사용자 리서치와 데이터 정리를 지원하며 실제 프로덕트 개선에 참여합니다.",
    companyIntro: "Canal Labs는 유학생 생활 서비스를 만드는 제품팀입니다. 작고 빠른 팀에서 사용자 리서치를 바로 제품 개선으로 연결합니다.",
    responsibilities: "학생 사용자 인터뷰 섭외 및 기록 정리\n프로덕트 사용 데이터와 피드백 분류\n기능 개선 아이디어 문서화\n팀 미팅에서 리서치 인사이트 공유",
    requirements: "사용자 관찰과 문제 정의에 관심 있는 분\n스프레드시트나 Notion으로 자료 정리가 가능한 분\n주 12시간 이상 근무 가능한 분",
    featured: true,
    id: "canal-product-student",
    location: "Rotterdam",
    tags: ["리서치", "데이터", "학생 우대"],
    title: "Product Working Student",
    type: "워킹 스튜던트"
  },
  {
    accent: "dark",
    applyTarget: "mailto:careers@example.com",
    company: "Morrow Studio",
    deadline: "2026-10-04",
    department: "Design",
    description: "디지털 브랜드 경험을 설계하고 글로벌 클라이언트 프로젝트를 함께 진행합니다.",
    companyIntro: "Morrow Studio는 브랜드 아이덴티티와 디지털 경험을 만드는 암스테르담 기반 디자인 스튜디오입니다.",
    responsibilities: "브랜드 리서치와 무드보드 제작\n웹/소셜 채널용 그래픽 시안 작업\n클라이언트 프레젠테이션 자료 보조\n디자인 시스템 에셋 정리",
    requirements: "Figma 또는 Adobe 툴 사용 경험이 있는 분\n시각 디자인 포트폴리오 제출 가능한 분\n영어 업무 커뮤니케이션이 가능한 분",
    featured: true,
    id: "morrow-junior-designer",
    location: "Amsterdam",
    tags: ["브랜딩", "디지털", "주니어"],
    title: "Junior Brand Designer",
    type: "풀타임"
  },
  {
    accent: "blue",
    applyTarget: "mailto:careers@example.com",
    company: "Delta Analytics",
    deadline: "2026-09-12",
    department: "Data",
    description: "비즈니스 데이터를 정리하고 리포트 자동화 및 인사이트 도출을 지원합니다.",
    companyIntro: "Delta Analytics는 B2B 데이터를 분석해 운영 의사결정을 돕는 컨설팅 팀입니다.",
    responsibilities: "원천 데이터 정리와 품질 체크\n반복 리포트 템플릿 업데이트\n시장/고객 데이터의 간단한 인사이트 도출\n분석 결과를 슬라이드로 요약",
    requirements: "Excel 또는 Google Sheets 활용이 익숙한 분\n숫자와 구조화된 자료를 꼼꼼하게 다루는 분\nSQL 또는 Python 경험이 있으면 우대",
    id: "delta-data-analyst",
    location: "Utrecht",
    tags: ["분석", "리포팅", "학생 우대"],
    title: "Data Analyst Intern",
    type: "인턴"
  },
  {
    accent: "dark",
    applyTarget: "mailto:careers@example.com",
    company: "Tulip Commerce",
    deadline: null,
    department: "Operations",
    description: "한국과 유럽 파트너 간 운영 커뮤니케이션과 프로젝트 일정을 관리합니다.",
    companyIntro: "Tulip Commerce는 한국 브랜드의 유럽 진출을 돕는 운영 파트너입니다.",
    responsibilities: "파트너사 이메일 커뮤니케이션 보조\n프로젝트 일정과 체크리스트 관리\n상품/물류 관련 자료 정리\n한국어-영어 간 기본 문서 확인",
    requirements: "한국어와 영어 커뮤니케이션이 모두 가능한 분\n원격 업무에서 일정 관리를 잘하는 분\n운영, 물류, 커머스에 관심 있는 분",
    id: "tulip-operations",
    location: "Remote",
    tags: ["한국어", "원격", "운영"],
    title: "Korea Operations Coordinator",
    type: "계약직"
  },
  {
    accent: "orange",
    applyTarget: "mailto:careers@example.com",
    company: "Studio Noord",
    deadline: "2026-09-30",
    department: "Content",
    description: "소셜 채널 콘텐츠 기획과 제작, 현지 트렌드 리서치를 함께합니다.",
    companyIntro: "Studio Noord는 유럽 로컬 브랜드의 콘텐츠와 캠페인을 만드는 크리에이티브 팀입니다.",
    responsibilities: "소셜 콘텐츠 아이디어 기획\n현지 트렌드와 레퍼런스 리서치\n짧은 카피 작성 및 이미지 에셋 정리\n콘텐츠 업로드 일정 관리",
    requirements: "Instagram, TikTok 등 소셜 콘텐츠 감각이 있는 분\n간단한 이미지 편집 또는 영상 편집 경험이 있는 분\n주 8-16시간 파트타임 근무 가능한 분",
    id: "noord-content",
    location: "The Hague",
    tags: ["소셜 미디어", "콘텐츠", "파트타임"],
    title: "Content Assistant",
    type: "파트타임"
  },
  {
    accent: "dark",
    applyTarget: "mailto:careers@example.com",
    company: "Harbor Fintech",
    deadline: "2026-10-11",
    department: "Engineering",
    description: "핀테크 서비스의 프론트엔드 기능 개발과 품질 개선에 참여합니다.",
    companyIntro: "Harbor Fintech는 유럽 소비자를 위한 결제 및 개인 금융 도구를 개발하는 기술 회사입니다.",
    responsibilities: "React 기반 화면 구현과 UI 개선\n버그 리포트 재현 및 수정\n컴포넌트 문서와 테스트 보조\n디자이너, 백엔드 엔지니어와 협업",
    requirements: "React와 TypeScript 기본 경험이 있는 분\nGit 기반 협업 흐름을 이해하는 분\n사용자 경험과 코드 품질을 함께 신경 쓰는 분",
    id: "harbor-frontend",
    location: "Amsterdam",
    tags: ["React", "핀테크", "주니어"],
    title: "Junior Frontend Engineer",
    type: "풀타임"
  },
  {
    accent: "blue",
    applyTarget: "mailto:careers@example.com",
    company: "Common Ground",
    deadline: "2026-09-21",
    department: "Community",
    description: "국제 학생 프로그램과 오프라인 커뮤니티 이벤트 운영을 지원합니다.",
    companyIntro: "Common Ground는 국제 학생을 위한 커뮤니티 프로그램과 멤버십 이벤트를 운영합니다.",
    responsibilities: "행사 참석자 커뮤니케이션\n프로그램 운영 체크리스트 관리\n현장 세팅과 참가자 안내\n이벤트 후 피드백 정리",
    requirements: "사람들과 소통하는 일을 좋아하는 분\n오프라인 행사 운영 경험이 있으면 우대\n저녁 또는 주말 행사 참여가 가능한 분",
    id: "common-community",
    location: "Amsterdam",
    tags: ["이벤트", "국제 학생", "커뮤니티"],
    title: "Community Working Student",
    type: "워킹 스튜던트"
  },
  {
    accent: "orange",
    applyTarget: "mailto:careers@example.com",
    company: "Field Office",
    deadline: "2026-09-24",
    department: "Research",
    description: "유럽 소비자 동향을 조사하고 인터뷰 및 리서치 자료 정리를 담당합니다.",
    companyIntro: "Field Office는 브랜드와 기관을 위한 현장 리서치 프로젝트를 수행하는 팀입니다.",
    responsibilities: "소비자 트렌드 desk research\n인터뷰 질문지와 기록 정리\n리서치 자료 번역 및 요약\n프로젝트별 인사이트 문서 작성",
    requirements: "자료 조사와 글 정리에 강점이 있는 분\n영어 자료를 읽고 요약할 수 있는 분\n시장 조사나 문화 리서치에 관심 있는 분",
    id: "field-research",
    location: "Eindhoven",
    tags: ["시장 조사", "인터뷰", "영어 가능"],
    title: "Market Research Intern",
    type: "인턴"
  }
];
