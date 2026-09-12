export type JobType = "풀타임" | "워킹 스튜던트" | "파트타임" | "인턴" | "계약직" | "공고 확인";

export type BusinessJob = {
  accent: "orange" | "blue" | "dark";
  applyTarget: string;
  company: string;
  deadline: string | null;
  department: string;
  description: string;
  companyIntro: string;
  body?: string;
  responsibilities: string;
  requirements: string;
  featured?: boolean;
  id: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  isPreviewOnly?: boolean;
  language?: "en" | "ko" | "nl";
  location: string;
  logoUrl?: string | null;
  tags: string[];
  title: string;
  type: JobType;
};

type BusinessDetailInput = {
  companyIntro?: string | null;
  description: string;
  language?: "en" | "ko" | "nl";
  requirements?: string | null;
  responsibilities?: string | null;
};

type ParsedBusinessDetails = {
  companyIntro: string;
  language: "en" | "ko" | "nl";
  requirements: string;
  responsibilities: string;
  summary: string;
};

const businessDetailHeadings = {
  en: {
    companyIntro: "Company overview",
    requirements: "Your profile",
    responsibilities: "What you'll do"
  },
  ko: {
    companyIntro: "회사 소개",
    requirements: "자격 요건",
    responsibilities: "주요 업무"
  },
  nl: {
    companyIntro: "Over het bedrijf",
    requirements: "Wie jij bent",
    responsibilities: "Wat je gaat doen"
  }
} as const;

function present(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function plainText(value: string | null | undefined) {
  return present(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;\/?[a-z][^&]*?&gt;/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detailLanguage(input: BusinessDetailInput) {
  if (input.language) return input.language;
  const sourceText = [input.description, input.companyIntro, input.responsibilities, input.requirements]
    .map(plainText)
    .join(" ");
  return /[가-힣]/.test(sourceText) ? "ko" : "en";
}

export function composeBusinessDetailText(input: BusinessDetailInput) {
  const language = detailLanguage(input);
  const headings = businessDetailHeadings[language];
  const sections = [
    [headings.companyIntro, input.companyIntro],
    [headings.responsibilities, input.responsibilities],
    [headings.requirements, input.requirements]
  ];
  const sectionText = sections
    .map(([heading, value]) => present(value) ? `${heading}\n${present(value)}` : "")
    .filter(Boolean)
    .join("\n\n");
  return [present(input.description), sectionText].filter(Boolean).join("\n\n");
}

export function resolveBusinessDetails(input: BusinessDetailInput): ParsedBusinessDetails {
  const language = detailLanguage(input);
  const headings = businessDetailHeadings[language];
  const parsed: ParsedBusinessDetails = {
    companyIntro: "",
    language,
    requirements: "",
    responsibilities: "",
    summary: plainText(input.description)
  };
  let active: "companyIntro" | "requirements" | "responsibilities" | "summary" = "summary";
  const summaryLines: string[] = [];
  const buckets = {
    companyIntro: [] as string[],
    requirements: [] as string[],
    responsibilities: [] as string[]
  };

  plainText(input.description).split(/\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    const normalized = line.replace(/[:：]+$/, "");
    if (normalized === headings.companyIntro) {
      active = "companyIntro";
      return;
    }
    if (normalized === headings.responsibilities) {
      active = "responsibilities";
      return;
    }
    if (normalized === headings.requirements) {
      active = "requirements";
      return;
    }
    if (normalized === "지원하기" || normalized === "Apply") {
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
  parsed.requirements = present(input.requirements) || buckets.requirements.join("\n") || (
    language === "en"
      ? "Review the role and company information before applying, and highlight the experience and interests most relevant to the position."
      : "지원 전 회사와 포지션 정보를 확인한 뒤, 본인의 경험과 관심사를 중심으로 지원서를 준비해주세요."
  );
  return parsed;
}

export const businessPreviewJobs: BusinessJob[] = [
  {
    accent: "orange",
    applyTarget: "#",
    company: "bunq",
    companyIntro: "bunq는 암스테르담 기반의 핀테크 기업으로, 모바일 중심의 국제 금융 서비스를 만들고 있습니다.",
    deadline: null,
    department: "커뮤니티·그로스",
    description: "학생 커뮤니티 캠페인, 현지 파트너십, 국제 사용자 피드백 수집을 함께 지원하는 인턴 포지션입니다.",
    id: "preview-bunq-community-growth-intern",
    isPreviewOnly: true,
    language: "ko",
    location: "Amsterdam",
    logoUrl: "/images/partners/bunq.png",
    requirements: "국제 학생 관점, 영어 커뮤니케이션, 핀테크와 커뮤니티/그로스 마케팅에 대한 관심이 있으면 좋습니다.",
    responsibilities: "학생 커뮤니티 캠페인 지원\n현지 파트너십 아이디어 정리\n국제 사용자 피드백 수집",
    tags: ["핀테크", "커뮤니티", "그로스"],
    title: "커뮤니티·그로스 인턴",
    type: "인턴"
  },
  {
    accent: "blue",
    applyTarget: "#",
    company: "ASML",
    companyIntro: "ASML은 네덜란드에 본사를 둔 글로벌 반도체 장비 기업입니다.",
    deadline: null,
    department: "고객 기술지원",
    description: "반도체 장비, 문제 해결, 고객-facing 기술 업무에 관심 있는 학생에게 어울리는 엔지니어링 포지션입니다.",
    id: "preview-asml-customer-support-engineer",
    isPreviewOnly: true,
    language: "ko",
    location: "Veldhoven",
    requirements: "공학, 물리, 메카트로닉스 등 관련 전공과 분석적 문제 해결 역량이 있으면 좋습니다.",
    responsibilities: "기술 이슈 분석 지원\n고객 안내 자료 정리\n장비 성능 관련 엔지니어 협업",
    tags: ["엔지니어링", "반도체", "신입"],
    title: "고객 기술지원 엔지니어",
    type: "풀타임"
  },
  {
    accent: "dark",
    applyTarget: "#",
    company: "Adyen",
    companyIntro: "Adyen은 암스테르담 기반의 글로벌 결제 플랫폼 기업입니다.",
    deadline: null,
    department: "운영",
    description: "결제 운영, 내부 툴 관리, 반복 업무 개선을 지원하는 워킹 스튜던트 포지션입니다.",
    id: "preview-adyen-operations-working-student",
    isPreviewOnly: true,
    language: "ko",
    location: "Amsterdam",
    requirements: "경영, 경제, 데이터, 기술 관련 전공과 꼼꼼한 업무 처리 능력, 명확한 커뮤니케이션이 있으면 좋습니다.",
    responsibilities: "운영 업무 흐름 지원\n가맹점 요청 및 내부 데이터 정리\n반복 프로세스 개선 보조",
    tags: ["결제", "운영", "워킹 스튜던트"],
    title: "운영 워킹 스튜던트",
    type: "워킹 스튜던트"
  },
  {
    accent: "orange",
    applyTarget: "#",
    company: "Booking.com",
    companyIntro: "Booking.com은 암스테르담에 본사를 둔 글로벌 여행 테크 기업입니다.",
    deadline: null,
    department: "데이터·프로덕트",
    description: "사용자 행동, 실험 결과, 제품 지표를 분석해 프로덕트 팀의 의사결정을 돕는 인턴 포지션입니다.",
    id: "preview-booking-product-data-intern",
    isPreviewOnly: true,
    language: "ko",
    location: "Amsterdam",
    requirements: "데이터 사이언스, 계량경제, 비즈니스 분석 등 관련 전공과 SQL 또는 스프레드시트 경험이 있으면 좋습니다.",
    responsibilities: "제품 및 실험 데이터 분석\n대시보드와 인사이트 노트 정리\n프로덕트 팀 의사결정 지원",
    tags: ["데이터", "프로덕트", "분석"],
    title: "프로덕트 데이터 분석 인턴",
    type: "인턴"
  }
];

export const businessJobs: BusinessJob[] = [
  {
    accent: "orange",
    applyTarget: "https://nl.linkedin.com/jobs/view/social-media-specialist-eu-at-samyang-europe-4461659896",
    company: "Samyang Foods Europe",
    deadline: null,
    department: "Social Media & Content",
    description: "Own and grow Buldak's social presence across Europe through culturally relevant content, creator partnerships, community engagement, and performance-led campaigns.",
    companyIntro: "Samyang Foods Europe is building Buldak into a leading youth-culture food brand across European markets. The European team connects global brand direction with fast-moving local trends, creators, communities, and commerce.",
    responsibilities: "Develop and execute the European social media strategy and content calendar\nLead day-to-day publishing and channel management, with a strong focus on TikTok\nBuild influencer, creator, and UGC partnerships across priority markets\nTrack performance, social listening, and cultural trends to improve campaigns\nSupport social commerce, community engagement, and collaboration with local teams and global HQ",
    requirements: "3–5 years of experience in social media, content, or digital marketing, preferably in FMCG\nStrong knowledge of TikTok, youth culture, paid social, and social analytics\nHands-on creator and influencer collaboration experience\nA proactive, data-informed mindset with strong content judgement\nFluent English; German, Korean, or another European language is a plus",
    featured: true,
    id: "samyang-social-media-specialist-eu",
    language: "en",
    location: "Amstelveen",
    tags: ["Social Media", "FMCG", "English", "Europe"],
    title: "Social Media Specialist (EU)",
    type: "풀타임"
  },
  {
    accent: "orange",
    applyTarget: "https://nl.linkedin.com/jobs/view/working-student-talent-acquisition-at-picnic-technologies-4257471853",
    company: "Picnic Technologies",
    deadline: null,
    department: "Talent Acquisition",
    description: "Join Picnic's Recruitment team and help connect talented people from around the world with the right opportunities across the company.",
    companyIntro: "Picnic Technologies is a fast-growing, data-driven online supermarket. Its international team is building a sustainable grocery delivery model and improving the customer experience through technology and operational innovation.",
    responsibilities: "Collaborate with recruiters and internal teams to understand the requirements of open positions\nSource potential candidates through LinkedIn Search and other techniques, and introduce them to relevant roles at Picnic\nSupport creative strategies for building strong and diverse talent pipelines\nShare ideas that can improve sourcing processes and recruitment outcomes\nSupport recruitment initiatives and events, including the Business Course with the Analytics Recruitment team",
    requirements: "Currently studying Psychology, Human Resource Management, Business Administration, or a related field\nPrevious internship or working-student experience, preferably in sourcing or recruitment\nAvailable for at least 16–20 hours per week\nExcellent verbal and written English; Dutch, German, or French is a plus\nA collaborative mindset, strong organisational skills, and close attention to detail\nExperience with Greenhouse ATS, or an interest in learning how to use it",
    id: "picnic-talent-acquisition-working-student",
    language: "en",
    location: "Amsterdam",
    tags: ["Talent Acquisition", "Recruitment", "16–20 hours/week"],
    title: "Working Student – Talent Acquisition",
    type: "워킹 스튜던트"
  },
  {
    accent: "blue",
    applyTarget: "https://nl.linkedin.com/jobs/view/working-student-business-analyst-tech-at-picnic-technologies-4435579006",
    company: "Picnic Technologies",
    deadline: null,
    department: "Business Analytics & Tech",
    description: "Use data, machine learning, and commercial thinking to solve high-impact questions across Picnic's technology and operations.",
    companyIntro: "Picnic is a fast-growing, technology-led online supermarket. Its international teams combine software, data, logistics, and commercial expertise to improve the grocery experience at scale.",
    responsibilities: "Solve critical business questions using data and structured analysis\nBuild and optimise analytical models for operational and commercial decisions\nIdentify opportunities across logistics, technology, and the customer proposition\nCommunicate insights clearly to technical and non-technical stakeholders\nOwn projects from problem definition through recommendation",
    requirements: "Currently pursuing a Master's in Computer Science, AI, Data Science, Mathematics, Econometrics, Information Systems, or a related field\nWorking knowledge of machine learning, SQL, and Python\nStrong analytical and consulting-style problem-solving skills\nFluent English and eligible to work in the EU\nAvailable at least 16 hours per week for a minimum of four months",
    id: "picnic-working-student-business-analyst-tech",
    language: "en",
    location: "Amsterdam",
    tags: ["Business Analytics", "SQL", "Python", "16+ hours/week"],
    title: "Working Student - Business Analyst Tech",
    type: "워킹 스튜던트"
  },
  {
    accent: "dark",
    applyTarget: "https://nl.linkedin.com/jobs/view/werkstudent-network-development-at-fastned-4460737119",
    company: "Fastned",
    deadline: null,
    department: "Network Development",
    description: "Help Fastned identify new charging locations and commercial partners while building the pipeline for Europe's next generation of fast-charging stations.",
    companyIntro: "Fastned bouwt sinds 2012 aan een Europees netwerk van snellaadstations. Met meer dan 400 stations in negen landen werkt het bedrijf aan de volgende groeifase richting 1.000 locaties.",
    responsibilities: "Onderzoek kansrijke locaties, markten en potentiële partners\nBouw en onderhoud een gestructureerde prospect- en acquisitiepipeline\nBenader leads via telefoon, e-mail en LinkedIn\nLeg voortgang en commerciële informatie zorgvuldig vast in het CRM\nSignaleer marktontwikkelingen en werk samen met interne teams",
    requirements: "Je volgt een hbo- of wo-opleiding in vastgoed, economie, bedrijfskunde of een vergelijkbare richting\nJe hebt interesse in sales, business development, duurzaamheid en mobiliteit\nJe communiceert vloeiend in het Nederlands en Engels\nJe werkt zelfstandig, gestructureerd, analytisch en proactief\nErvaring met CRM of acquisitie is een plus",
    id: "fastned-werkstudent-network-development",
    language: "nl",
    location: "Amsterdam",
    tags: ["Network Development", "Sales", "Nederlands", "16+ uur/week"],
    title: "Werkstudent Network Development",
    type: "워킹 스튜던트"
  },
  {
    accent: "orange",
    applyTarget: "https://nl.linkedin.com/jobs/view/working-student-payroll-operations-process-automation-at-fastned-4460742102",
    company: "Fastned",
    deadline: null,
    department: "Payroll Operations",
    description: "Improve payroll operations by automating recurring workflows, strengthening controls, and turning manual processes into scalable systems.",
    companyIntro: "Fastned is a European fast-charging company operating more than 400 stations across nine countries. Its People and Finance teams support the systems needed for continued international growth.",
    responsibilities: "Automate absence and payroll workflows in HiBob\nExplore AI agents and process automation for recurring payroll tasks\nConsolidate working-student hours, deductions, and payroll inputs\nSupport pension invoice and balance-sheet reconciliations\nDocument and improve controls across payroll operations",
    requirements: "Bachelor's student in Business, Data Analytics, Information Systems, or a related field\nStrong analytical skills and confidence in Excel\nInterest in Power BI, SQL, AI, and process automation\nAble to handle confidential data accurately\nFluent English and available 16–20 hours per week for at least six months",
    id: "fastned-payroll-operations-process-automation",
    language: "en",
    location: "Amsterdam",
    tags: ["Payroll", "Automation", "Excel", "16–20 hours/week"],
    title: "Working Student - Payroll Operations & Process Automation",
    type: "워킹 스튜던트"
  },
  {
    accent: "blue",
    applyTarget: "https://nl.linkedin.com/jobs/view/payments-compliance-innovation-working-student-at-just-eat-takeaway-com-4460774228",
    company: "Just Eat Takeaway.com",
    deadline: null,
    department: "Payments Operations",
    description: "Support payments compliance and operational innovation while exploring how AI can make screening, due diligence, and documentation more effective.",
    companyIntro: "Just Eat Takeaway.com is a global online food delivery marketplace. Its Payments Operations team works across compliance, verification, transaction monitoring, and process innovation.",
    responsibilities: "Explore AI use cases for screening, document review, and compliance operations\nSupport customer due diligence, business verification, AML, and transaction monitoring\nCoordinate with operations, compliance, and strategy teams\nHelp clear operational backlogs and maintain vendor due-diligence documentation\nMonitor relevant regulatory changes and support project administration",
    requirements: "Currently pursuing a Master's in Business Administration, Finance, Law, or a related field\nFluent English with clear written and verbal communication\nStrong interest in technology, AI, payments, and regulatory operations\nGoal-oriented, responsible, and comfortable working across teams\nAble to structure information and follow through on operational details",
    id: "jet-payments-compliance-innovation-working-student",
    language: "en",
    location: "Amsterdam",
    tags: ["Payments", "Compliance", "AI", "AML"],
    title: "Payments, Compliance & Innovation Working Student",
    type: "워킹 스튜던트"
  },
  {
    accent: "dark",
    applyTarget: "https://nl.linkedin.com/jobs/view/payroll-assistant-working-student-at-boston-consulting-group-bcg-4459481754",
    company: "Boston Consulting Group (BCG)",
    deadline: null,
    department: "Payroll",
    description: "Support payroll administration and reporting for BCG offices in London, Amsterdam, and Brussels while helping improve day-to-day processes.",
    companyIntro: "Boston Consulting Group is a global management consulting firm. This working-student role sits within the payroll team supporting multiple European offices.",
    responsibilities: "Support payroll activities across London, Amsterdam, and Brussels\nProcess payroll data, timesheets, reports, and reconciliations\nRespond to routine payroll questions with discretion and accuracy\nMaintain clear records and help improve payroll processes\nWork from the Amsterdam office two to three times per week",
    requirements: "Strong written and spoken English; Dutch or French is a plus\nHigh discretion when handling personal and payroll data\nBasic Excel skills and close attention to detail\nFlexible, organised, and comfortable working as part of a team\nAble to work from the Amsterdam office regularly",
    id: "bcg-payroll-assistant-working-student",
    language: "en",
    location: "Amsterdam",
    tags: ["Payroll", "Excel", "English", "Working Student"],
    title: "Payroll Assistant Working Student",
    type: "워킹 스튜던트"
  },
  {
    accent: "orange",
    applyTarget: "https://dalba.career.greetinghr.com/ko/o/231289",
    company: "d'Alba Global",
    deadline: null,
    department: "Global Marketing Operations",
    description: "글로벌 퍼포먼스 광고, 콘텐츠 크리에이터 협업, 프로모션 소재 제작과 시장 분석을 함께 경험하는 인턴 포지션입니다.",
    companyIntro: "d'Alba Global은 프리미엄 뷰티 경험을 전 세계 고객에게 제공하며 빠르게 성장하고 있는 K-뷰티 기업입니다. 해외2본부는 북미, 영국, 인도, 호주와 유럽 주요 시장의 온라인·B2B·그로스·브랜드 마케팅을 담당합니다.",
    responsibilities: "퍼포먼스 광고 세팅, 비용 조정, 타깃 변경 등 운영 지원\n콘텐츠 크리에이터 커뮤니케이션 및 계약 업무\n제품 USP를 반영한 프로모션 소재 기획과 제작\n경쟁 브랜드 및 시장 트렌드 리서치와 분석\n고객 댓글 및 CS 관리",
    requirements: "뷰티·스킨케어·메이크업 관련 소셜미디어 콘텐츠에 관심이 많은 분\n구글, 아마존, 메타, 틱톡, 유튜브 등 주요 디지털 매체 경험이 있는 분\n데이터 기반으로 문제를 정의하고 개선한 경험이 있는 분\n주도적으로 가설을 수립하고 실행하는 것을 즐기는 분\n영어 커뮤니케이션이 가능하면 우대",
    id: "dalba-global-marketing-operations-intern",
    language: "ko",
    location: "대한민국",
    tags: ["글로벌 마케팅", "뷰티", "퍼포먼스 광고", "인턴"],
    title: "[d'Alba Global] Global Marketing Operations (Intern)",
    type: "인턴"
  },
  {
    accent: "blue",
    applyTarget: "https://nl.linkedin.com/jobs/view/internship-%E2%80%93-products-strategy-consulting-at-accenture-the-netherlands-4453249970",
    company: "Accenture the Netherlands",
    deadline: null,
    department: "Products Strategy & Consulting",
    description: "Join Accenture's Products Strategy & Consulting team for a five-to-six-month internship combining client work, market analysis, and business transformation.",
    companyIntro: "Accenture Strategy & Consulting helps organisations respond to disruption through data, technology, industry expertise, and practical transformation programs.",
    responsibilities: "Support consulting teams on client assignments in the Products industry\nPrepare workshops, proposals, presentations, and project materials\nConduct market studies and stakeholder analysis\nJoin project meetings and contribute to reports and recommendations\nTranslate research and data into practical client insights",
    requirements: "Currently enrolled in a Master's program throughout the internship\nStrong analytical and problem-solving skills\nProactive, collaborative, and results-oriented working style\nInterest in business, technology, digital transformation, and consulting\nAvailable for five to six months, approximately 40 hours per week",
    id: "accenture-products-strategy-consulting-internship",
    language: "en",
    location: "Amsterdam",
    tags: ["Strategy", "Consulting", "Master's", "40 hours/week"],
    title: "Internship – Products Strategy & Consulting",
    type: "인턴"
  },
  {
    accent: "dark",
    applyTarget: "https://nl.linkedin.com/jobs/view/portfolio-management-working-internship-%E2%80%94-technology-strategy-and-transformation-at-accenture-the-netherlands-4453252885",
    company: "Accenture the Netherlands",
    deadline: null,
    department: "Technology Strategy & Transformation",
    description: "Werk mee aan Accenture's Portfolio Management-capability met onderzoek, frameworks, benchmarks en herbruikbare assets voor klantprojecten.",
    companyIntro: "Accenture Technology Strategy & Transformation helpt organisaties om business- en technologiestrategie te verbinden en digitale transformaties om te zetten in meetbare waarde.",
    responsibilities: "Bouw kennis op rond relevante Portfolio Management-thema's\nOntwikkel modellen, methodieken, templates en herbruikbare assets verder\nBenchmark practices tussen industrieën en marktleiders\nDraag bij aan de Portfolio Management Playbook\nOnderzoek de rol van GenAI en data in portfolio steering, prioritering en forecasting",
    requirements: "Je bent gedurende de volledige stage ingeschreven als masterstudent aan een Nederlandse universiteit\nJe hebt een achtergrond in business, IT, management of een vergelijkbare richting\nJe spreekt en schrijft vloeiend Nederlands en Engels\nJe hebt affiniteit met technologie, IT en strategisch portfoliomanagement\nJe bent circa 40 uur per week beschikbaar voor vijf tot zes maanden",
    id: "accenture-portfolio-management-working-internship",
    language: "nl",
    location: "Amsterdam",
    tags: ["Portfolio Management", "Technology Strategy", "Nederlands", "Master"],
    title: "Portfolio Management Working Internship — Technology, Strategy and Transformation",
    type: "인턴"
  },
  {
    accent: "orange",
    applyTarget: "https://nl.linkedin.com/jobs/view/internship-visiting-associate-netherlands-at-boston-consulting-group-bcg-4461686209",
    company: "Boston Consulting Group (BCG)",
    deadline: null,
    department: "Consulting",
    description: "Spend two to four months as part of a BCG case team, solving complex client challenges and turning analysis into practical recommendations.",
    companyIntro: "Boston Consulting Group is a global management consulting firm that works with leaders across industries on strategy, transformation, operations, and growth.",
    responsibilities: "Join a case team and contribute to real client work\nStructure complex business questions and conduct analytical research\nDevelop insights and recommendations with consultants and clients\nPrepare clear presentations and supporting materials\nLearn through formal training, mentorship, and team feedback",
    requirements: "Final-year Bachelor's or Master's student with strong academic performance\nExcellent analytical and critical-thinking skills\nComfortable working in a fast-paced, collaborative environment\nStrong communication skills in English and Dutch\nAvailable for a two-to-four-month internship",
    id: "bcg-visiting-associate-internship-netherlands",
    language: "en",
    location: "Amsterdam",
    tags: ["Consulting", "Case Team", "Dutch", "Internship"],
    title: "Internship, Visiting Associate, Netherlands",
    type: "인턴"
  },
  {
    accent: "blue",
    applyTarget: "https://nl.linkedin.com/jobs/view/intern-seo-geo-at-mollie-4453122607",
    company: "Mollie",
    deadline: null,
    department: "SEO & GEO",
    description: "Help Mollie's organic growth team improve discoverability across traditional search and emerging AI-powered answer experiences.",
    companyIntro: "Mollie is a European financial services platform serving more than 250,000 businesses. Its international team builds simple payment and money-management products for growing companies.",
    responsibilities: "Publish and optimise website content through the CMS and Framer\nConduct keyword and search-intent research\nSupport technical SEO audits and implementation follow-up\nAnalyse organic performance and prepare recurring reports\nResearch GEO, AEO, and AI-search opportunities",
    requirements: "Currently enrolled in a Bachelor's or Master's in Marketing, Communications, Business, Digital Media, or a related field\nFluent English with strong organisational skills\nInterest in SEO, GEO, AEO, and AI-powered search\nComfortable working with spreadsheets and performance data\nDutch, French, German, Italian, or Framer experience is a plus",
    id: "mollie-intern-seo-geo",
    language: "en",
    location: "Amsterdam",
    tags: ["SEO", "GEO", "Content", "Fintech"],
    title: "Intern - SEO/GEO",
    type: "인턴"
  },
  {
    accent: "dark",
    applyTarget: "https://nl.linkedin.com/jobs/view/customer-excellence-intern-at-kraft-heinz-4461658952",
    company: "Kraft Heinz",
    deadline: null,
    department: "Customer Excellence",
    description: "Support customer service and supply-chain execution by connecting stock, orders, internal teams, and customers with accurate, timely information.",
    companyIntro: "Kraft Heinz is a global food company with a large portfolio of household brands. The Amsterdam-based Customer Excellence team connects commercial priorities with daily supply-chain operations.",
    responsibilities: "Communicate stock and order information to customers and internal teams\nMatch available stock with customer orders\nSupport service-level improvement and issue resolution\nMaintain accurate operational data and reporting\nCollaborate with supply-chain and commercial stakeholders",
    requirements: "Bachelor's or Master's student, preferably in supply chain or a related field\nFluent English; Dutch is preferred\nStrong communication skills and close attention to data accuracy\nConfident using Excel and structured operational processes\nEligible to work in the EU and enrolled for at least half of the six-month internship",
    id: "kraft-heinz-customer-excellence-intern",
    language: "en",
    location: "Amsterdam",
    tags: ["Supply Chain", "Customer Excellence", "Excel", "6 months"],
    title: "Customer Excellence Intern",
    type: "인턴"
  },
  {
    accent: "orange",
    applyTarget: "https://nl.linkedin.com/jobs/view/strategic-partnerships-intern-at-qogita-4462445834",
    company: "Qogita",
    deadline: null,
    department: "Strategic Partnerships",
    description: "Support Qogita's brand-partner acquisition pipeline from research and outreach through qualification, purchase orders, and fulfilment.",
    companyIntro: "Qogita is a fast-growing B2B wholesale marketplace that connects retailers with branded products and suppliers through a technology-led procurement platform.",
    responsibilities: "Research high-potential brand partners and map decision-makers\nSupport outbound campaigns across email, calls, and LinkedIn\nQualify leads using pricing, stock, SKU, and demand criteria\nCoordinate purchase orders with K-beauty brands and logistics\nMaintain clean HubSpot pipeline records and weekly reporting",
    requirements: "Bachelor's or Master's student or recent graduate in Business, Economics, Strategy, or a related field\nAble to process commercial information quickly and make clear qualification calls\nProfessional written and spoken English\nHighly organised and able to manage several leads and orders at once\nInterest in FMCG, CPG, wholesale, Health & Beauty, or startup environments",
    id: "qogita-strategic-partnerships-intern",
    language: "en",
    location: "Amsterdam",
    tags: ["Partnerships", "K-Beauty", "HubSpot", "€900/month"],
    title: "Strategic Partnerships Intern",
    type: "인턴"
  },
  {
    accent: "blue",
    applyTarget: "https://nl.linkedin.com/jobs/view/market-development-intern-at-siemens-digital-industries-software-4460618264",
    company: "Siemens Digital Industries Software",
    deadline: null,
    department: "Market Development",
    description: "Use AI-assisted market intelligence and personalised outreach to help expand awareness and adoption of Siemens Xcelerator.",
    companyIntro: "Siemens Digital Industries Software helps industrial companies transform through software, automation, digital twins, and the Siemens Xcelerator portfolio.",
    responsibilities: "Apply AI tools to market and account intelligence\nCreate personalised outreach for prospective customers\nSupport Siemens Xcelerator advocacy and campaign execution\nMaintain CRM and marketing data in Salesforce and Eloqua\nHelp develop an ambassador strategy and measure engagement",
    requirements: "Studying or recently graduated in Business, Economics, Business & Technology, or a related field\nComfortable using generative AI and digital research tools\nStrong interest in industrial technology and digital transformation\nFluent English with clear communication skills\nOrganised, proactive, and available from 15 October 2026 to 31 March 2027",
    id: "siemens-market-development-intern",
    language: "en",
    location: "Rotterdam",
    tags: ["Market Development", "AI", "Salesforce", "Hybrid"],
    title: "Market Development Intern",
    type: "인턴"
  },
  {
    accent: "dark",
    applyTarget: "https://nl.linkedin.com/jobs/view/network-development-intern-at-xpeng-4448753811",
    company: "XPENG",
    deadline: null,
    department: "Network Development",
    description: "Support the design, renovation, and optimisation of XPENG retail stores as the electric-vehicle brand expands its European network.",
    companyIntro: "XPENG is a technology-led electric-vehicle company expanding its retail and service footprint in Europe. The Network Development team shapes efficient, consistent store environments.",
    responsibilities: "Help monitor store renovation processes against budget, quality, and timeline requirements\nTrack and document store-construction details\nProvide timely project updates to the project lead\nSupport store layout optimisation and related project tasks\nCoordinate information across internal and external stakeholders",
    requirements: "Student in architecture, interior design, retail management, or a related field\nDetail-oriented, patient, and able to solve practical problems\nProficient with Microsoft Office tools\nAble to communicate in English\nAutoCAD experience is a plus",
    id: "xpeng-network-development-intern",
    language: "en",
    location: "Diemen",
    tags: ["Retail Design", "Store Construction", "EV", "AutoCAD"],
    title: "Network Development Intern",
    type: "인턴"
  },
  {
    accent: "orange",
    applyTarget: "https://nl.linkedin.com/jobs/view/global-graduate-program-commerce-at-the-heineken-company-4459784300",
    company: "The HEINEKEN Company",
    deadline: "2026-09-20",
    department: "Commerce",
    description: "A three-year graduate journey with commercial, cross-functional, and international rotations designed to develop future leaders at HEINEKEN.",
    companyIntro: "The HEINEKEN Company is a global brewer with brands and operations around the world. Its Global Graduate Program combines real responsibility, international mobility, coaching, and structured development.",
    responsibilities: "Complete two six-month rotations in the Netherlands and one international rotation\nBuild experience across sales, marketing, digital innovation, and commercial strategy\nLead projects that strengthen customer relationships and brand growth\nDevelop stakeholder and change-management skills\nMove into an 18-month landing role in the Netherlands after the rotations",
    requirements: "Master's degree completed by the program start date\nGraduation date between January 2026 and March 2027, with no more than one year of post-graduate experience\nComfortable working in Dutch and English\nLegal right to work in the Netherlands without visa sponsorship\nFully mobile internationally and ready to start on 1 March 2027",
    id: "heineken-global-graduate-program-commerce",
    language: "en",
    location: "Leiden",
    tags: ["Graduate Program", "Commerce", "Dutch", "International"],
    title: "Global Graduate Program - Commerce",
    type: "풀타임"
  },
  {
    accent: "blue",
    applyTarget: "https://nl.linkedin.com/jobs/view/general-affairs-officer-at-hd-hyundai-marine-solution-europe-b-v-4462179920",
    company: "Hyundai Global Service Europe BV",
    deadline: null,
    department: "General Affairs",
    description: "Coordinate employee events, workplace services, office operations, and first-line IT support in Hyundai's Rotterdam office.",
    companyIntro: "HD Hyundai Marine Solution Europe B.V. supports the marine industry with engineering-based services across shipbuilding, engines, machinery, electrical systems, and smart, eco-friendly solutions.",
    responsibilities: "Plan internal events, employee activities, budgets, and external event participation\nCoordinate catering, cleaning, office greenery, and workplace services\nProvide first-line support for network, hardware, and software issues\nCoordinate escalations with the local IT partner\nManage IT assets for new joiners and leavers",
    requirements: "Proficiency in Microsoft Office, including Excel, PowerPoint, and Outlook\nFluent English; Korean and Dutch are pluses\nValid work permit for the Netherlands\nExcellent interpersonal, communication, and prioritisation skills\nPhotoshop or international-company experience is a plus",
    id: "hyundai-general-affairs-officer",
    language: "en",
    location: "Rotterdam",
    tags: ["General Affairs", "Office Operations", "IT Support", "English"],
    title: "General Affairs Officer",
    type: "풀타임"
  },
  {
    accent: "dark",
    applyTarget: "https://nl.linkedin.com/jobs/view/sales-officer-at-hd-hyundai-marine-solution-europe-b-v-4462776953",
    company: "Hyundai Global Service Europe BV",
    deadline: null,
    department: "Marine Parts Sales",
    description: "Manage quotations, order processing, logistics coordination, and customer relationships for marine-engine spare parts.",
    companyIntro: "HD Hyundai Marine Solution Europe B.V. is the European arm of HD Hyundai's engineering-based marine service business, supporting customers across engines, machinery, electrical systems, and smart solutions.",
    responsibilities: "Acquire orders from ship-management customers\nPrepare quotations and process spare-parts orders\nCoordinate deliveries between customers, sales, and logistics teams\nAssist the Sales Manager with commercial administration\nTravel to customers when required",
    requirements: "Proficiency in Microsoft Excel and Outlook\nFluent English and a valid work permit for the Netherlands\nStrong interpersonal and communication skills\nAble to multitask and prioritise daily workload\nB2B sales experience is a plus",
    id: "hyundai-sales-officer",
    language: "en",
    location: "Rotterdam",
    tags: ["B2B Sales", "Marine", "Order Processing", "English"],
    title: "Sales Officer",
    type: "풀타임"
  },
  {
    accent: "blue",
    applyTarget: "https://nl.linkedin.com/jobs/view/internal-medical-translator-english-to-korean-at-iqvia-4463251402",
    company: "IQVIA",
    deadline: null,
    department: "Language Solutions",
    description: "Translate and review life-sciences content from English into Korean while strengthening terminology assets, quality standards, and delivery processes.",
    companyIntro: "IQVIA is a global provider of clinical research services, commercial insights, healthcare intelligence, and specialised language solutions for life-sciences organisations.",
    responsibilities: "Translate written life-sciences material from English into culturally accurate Korean\nPreserve the meaning, structure, and style of source documents\nProofread terminology, grammar, spelling, and punctuation\nMaintain glossaries, translation memories, style guides, and internal assets\nIdentify instruction gaps and deliver translations on time to quality standards",
    requirements: "Native Korean and fluent English\nAt least three years of experience translating, reviewing, and editing life-sciences content\nDegree in translation or linguistics plus three years of experience, or at least five years of experience without a degree\nExperience with translation-management systems and CAT tools\nHigh accuracy, research ability, and problem-solving skills",
    id: "iqvia-internal-medical-translator-en-ko",
    language: "en",
    location: "EMEA · Remote",
    tags: ["Korean", "Translation", "Life Sciences", "Remote"],
    title: "Internal Medical Translator - English to Korean",
    type: "풀타임"
  }
];
