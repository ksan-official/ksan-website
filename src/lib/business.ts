export type JobType = "풀타임" | "워킹 스튜던트" | "파트타임" | "인턴" | "계약직";

export type BusinessJob = {
  accent: "orange" | "blue" | "dark";
  applyTarget: string;
  company: string;
  deadline: string | null;
  department: string;
  description: string;
  featured?: boolean;
  id: string;
  location: string;
  tags: string[];
  title: string;
  type: JobType;
};

export const businessJobs: BusinessJob[] = [
  {
    accent: "orange",
    applyTarget: "mailto:careers@example.com",
    company: "Northstar Mobility",
    deadline: "2026-09-18",
    department: "Marketing",
    description: "유럽 시장을 대상으로 브랜드 캠페인과 커뮤니티 콘텐츠 운영을 함께합니다.",
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
    id: "field-research",
    location: "Eindhoven",
    tags: ["시장 조사", "인터뷰", "영어 가능"],
    title: "Market Research Intern",
    type: "인턴"
  }
];
