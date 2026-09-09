export type KsanEvent = {
  id: string;
  title: string;
  summary: string;
  description: string;
  date: string;
  dateLabel: string;
  time: string;
  location: string;
  keywords: string[];
  status: "upcoming" | "past";
  image: string;
  recapImages?: string[];
  photoCount?: number;
  organizerName?: string;
  organizerLogo?: string;
  registrationTarget?: string;
  sponsors?: Array<{
    name: string;
    image?: string;
  }>;
  audience: string;
  agenda: string[];
};

export const ksanEvents: KsanEvent[] = [
  {
    id: "ksan-freshmen-networking-2026",
    title: "2026 KSAN 신입생 네트워킹",
    summary: "첫 만남의 어색함을 풀고 새로운 인연을 만드는 네트워킹",
    description:
      "안녕하세요, 네덜란드 한국 학생회 [KSAN]입니다.\n\n낯선 네덜란드에서의 유학생활,\n새로운 사람들과의 첫 만남이 어렵게 느껴진다면?\n\nKSAN과 함께 더 편하게 시작해보세요! 🙌🏻\n\n2026 KSAN 신입생 네트워킹 [첫 만남은 너무 어려워]가 돌아왔습니다 ✨\n새로운 친구를 만나고 싶은 신입생부터 재학생, 교환학생 등 네덜란드에서 새로운 교류를 희망하는 분이라면 누구나 환영합니다!\n\n학교, 전공, 거주 지역에 관계없이 한자리에 모여 편하게 이야기하고,\n유학생활에 대한 정보도 나누며 새로운 인연을 만들어보세요 💬🫶🏻\n\n어색한 첫 만남을 풀어줄 아이스브레이킹과 미니게임,\n자유롭게 이야기를 나눌 수 있는 자유 네트워킹,\n그리고 놓칠 수 없는 상품 추첨까지! 🎁\n\n혼자 와도, 친구와 함께 와도 부담 없이 즐길 수 있도록 준비했으니\n많은 관심과 참여 부탁드립니다!",
    date: "2026-09-12",
    dateLabel: "2026.09.12",
    time: "16:00–20:00 (CEST)",
    location: "Amstel Campuscafe, Tweede Boerhaavestraat 10, 1091 BD Amsterdam",
    keywords: ["신입생", "네트워킹"],
    status: "upcoming",
    image: "/images/events/ksan-freshmen-networking-2026/cover.png",
    organizerName: "KSAN",
    organizerLogo: "/images/ksan-logo-black.png",
    registrationTarget: "https://docs.google.com/forms/d/e/1FAIpQLSetjoyHkvLW-AacfhIFliE8Qb9oizU62n6bhKMYuC5egVWJ4w/viewform",
    audience: "선착순 60명 · 네덜란드 내 새로운 교류를 희망하는 누구나",
    agenda: [
      "16:20–16:30 | 개회식",
      "16:30–17:10 | 아이스 브레이킹",
      "17:10–17:50 | 자유 네트워킹 1",
      "17:50–18:20 | 게임",
      "18:20–19:20 | 자유 네트워킹 2",
      "19:20–19:40 | 상품 추첨",
      "19:40–19:50 | 폐회식"
    ]
  },
  {
    id: "ksan-sports-day-2026",
    title: "제 6회 KSAN 체육대회",
    summary: "함께 뛰고, 응원하고, 웃었던 특별한 하루",
    description:
      "안녕하세요, 네덜란드 한국 학생회 [KSAN] 입니다.\n\n제 6회 KSAN 체육대회 ‘폭싹 뛰었수다’에 함께해주신 모든 분들께 진심으로 감사드립니다 🙌\n여러분 덕분에 웃음과 열정이 가득한 특별한 하루가 되었습니다🔥\n\n이번 행사는 LG와 Shilla Market의 후원으로 더욱 풍성하게 진행될 수 있었는데요!\n다양한 지역에서 오신 분들과 소중한 인연도 만들고, 즐거운 추억도 많이 남기셨길 바랍니다 😊\n\n함께 뛰고, 응원하고, 웃었던 순간들 덕분에 이번 체육대회가 더욱 빛날 수 있었습니다✨\n\n참여해주신 모든 분들께 감사드리며, KSAN은 앞으로도 다양하고 재밌는 행사로 여러분을 찾아뵙겠습니다 :)\n\n다음 KSAN 이벤트에서도 꼭 다시 만나요!",
    date: "2026-05-09",
    dateLabel: "2026.05.09",
    time: "Completed",
    location: "Netherlands",
    keywords: ["체육", "커뮤니티"],
    status: "past",
    image: "/images/events/ksan-sports-day-2026/img-0842.jpg",
    recapImages: [
      "/images/events/ksan-sports-day-2026/img-0842.jpg",
      "/images/events/ksan-sports-day-2026/img-0888.jpg",
      "/images/events/ksan-sports-day-2026/img-1186.jpg",
      "/images/events/ksan-sports-day-2026/img-1169.jpg",
      "/images/events/ksan-sports-day-2026/img-0806.jpg"
    ],
    photoCount: 5,
    organizerName: "KSAN",
    organizerLogo: "/images/ksan-logo-black.png",
    sponsors: [{ name: "LG" }, { name: "Shilla Market" }],
    audience: "KSAN 체육대회 참가자",
    agenda: []
  },
  {
    id: "jobgo-2026",
    title: "제9회 JOB고 싶니?",
    summary: "현직자의 경험을 듣고 새로운 연결을 만든 커리어 네트워킹",
    description:
      "제9회 JOB고 싶니? With 네트워킹은 네덜란드에서 커리어를 고민하는 학생들과 다양한 분야의 현직자가 한자리에 모인 시간이었습니다.\n\n현직자의 경험을 가까이에서 듣고, 오픈 Q&A를 통해 실제 진로 고민을 함께 나눴습니다. 이어진 자유 네트워킹에서는 참가자와 멘토가 편하게 인사를 건네며 새로운 연결을 만들었습니다.\n\n함께해주신 모든 분들과 행사를 후원해주신 농심에 감사드립니다. 각자의 다음 걸음을 조금 더 선명하게 그려본 따뜻한 커리어 교류의 현장이었습니다.",
    date: "2026-02-14",
    dateLabel: "2026.02.14",
    time: "Completed",
    location: "Netherlands",
    keywords: ["커리어", "네트워킹"],
    status: "past",
    image: "/images/events/jobgo-2026/img-0720.jpg",
    recapImages: [
      "/images/events/jobgo-2026/img-0720.jpg",
      "/images/events/jobgo-2026/img-0690.jpg",
      "/images/events/jobgo-2026/img-0727.jpg",
      "/images/events/jobgo-2026/img-0562.jpg",
      "/images/events/jobgo-2026/img-0485.jpg"
    ],
    photoCount: 5,
    organizerName: "KSAN",
    organizerLogo: "/images/ksan-logo-black.png",
    sponsors: [{ name: "농심" }],
    audience: "네덜란드에서 진로와 커리어를 고민하는 학생",
    agenda: []
  },
  {
    id: "freshmen-networking-2025",
    title: "2025 신입생 네트워킹",
    summary: "새로운 도시에서 친구와 현실적인 생활 정보를 나눈 첫 만남",
    description:
      "2025 신입생 네트워킹은 네덜란드 생활을 시작한 신입생부터 재학생, 교환학생, 워홀러까지 한자리에 모여 편하게 인사를 나눈 시간이었습니다.\n\n아이스브레이킹과 미니게임을 함께하며 자연스럽게 가까워졌고, 학교와 전공을 넘어 학업·집 구하기·아르바이트 등 실제 생활에 필요한 경험도 나눴습니다.\n\n새로운 시작을 함께해주신 모든 참가자와 든든한 후원으로 자리를 빛내주신 파트너분들께 감사드립니다. 앞으로 이어질 인연의 출발점이 된 따뜻한 네트워킹 현장이었습니다.",
    date: "2025-09-05",
    dateLabel: "2025.09.05",
    time: "18:00–22:00",
    location: "Amstel Campus Cafe, Tweede Boerhaavestraat 10, 1091 BD Amsterdam",
    keywords: ["신입생", "네트워킹"],
    status: "past",
    image: "/images/events/freshmen-networking-2025/img-0412.jpg",
    recapImages: [
      "/images/events/freshmen-networking-2025/img-0412.jpg",
      "/images/events/freshmen-networking-2025/img-0361.jpg",
      "/images/events/freshmen-networking-2025/img-0338.jpg",
      "/images/events/freshmen-networking-2025/img-0373.jpg",
      "/images/events/freshmen-networking-2025/img-0425.jpg",
      "/images/events/freshmen-networking-2025/img-0340.jpg",
      "/images/events/freshmen-networking-2025/img-0435.jpg"
    ],
    photoCount: 7,
    organizerName: "KSAN",
    organizerLogo: "/images/ksan-logo-black.png",
    sponsors: [
      { name: "LG" },
      { name: "Ofood" },
      { name: "Daesang Europe B.V." },
      { name: "@jongga_eu" },
      { name: "Bunq", image: "/images/partners/bunq.png" },
      { name: "Boko International", image: "/images/partners/boko.png" },
      { name: "@nl.esimmu" },
      { name: "NordVPN", image: "/images/partners/nordvpn.png" },
      { name: "네덜란드 한인회" }
    ],
    audience: "신입생·재학생·교환학생·워홀러 및 네트워킹을 원하는 모든 분",
    agenda: []
  }
];

export const upcomingEvents = ksanEvents.filter((event) => event.status === "upcoming");

export function getKsanEvent(id: string) {
  return ksanEvents.find((event) => event.id === id);
}
