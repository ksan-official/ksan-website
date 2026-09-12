export type KsanEvent = {
  id: string;
  title: string;
  summary: string;
  description: string;
  date: string;
  dateLabel: string;
  time: string;
  city: string;
  location: string;
  mapQuery?: string;
  applicationDeadline?: string;
  keywords: string[];
  status: "upcoming" | "past";
  image: string;
  recapImages?: string[];
  photoCount?: number;
  organizerName?: string;
  organizerLogo?: string;
  price?: string;
  registrationTarget?: string;
  sponsors?: Array<{
    name: string;
    image?: string;
  }>;
  audience: string;
  agenda: string[];
};

export type EventTableRow = {
  description: string | null;
  id: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  location: string | null;
  published?: boolean | null;
  registration_target: string | null;
  source_id?: string | null;
  sponsors?: unknown;
  starts_at: string;
  title: string;
};

const eventDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  day: "2-digit",
  month: "2-digit",
  weekday: "short",
  year: "numeric"
});

const eventTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit"
});

function safeEventDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function firstSentence(value: string) {
  return value
    .split(/\r?\n\s*\r?\n+/)
    .map((item) => item.trim())
    .filter((item) => !isDefaultKsanGreeting(item))
    .find(Boolean) ?? "KSAN에서 준비한 행사입니다.";
}

export function isDefaultKsanGreeting(value: string) {
  return /^안녕하세요,\s*네덜란드\s+한국\s+학생회\s*\[KSAN\]\s*입니다\.?$/.test(value.trim());
}

function cityFromLocation(location: string) {
  const firstPart = location.split(/[,\n]/)[0]?.trim();
  return firstPart || "Netherlands";
}

function formatDateLabel(date: Date) {
  return eventDateFormatter.format(date).replace(/\.\s?/g, ".").replace(/\s+/g, " ").trim();
}

export function getEventStatusByDate(value: string | Date): KsanEvent["status"] {
  const date = typeof value === "string" ? safeEventDate(value) : value;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime() ? "upcoming" : "past";
}

export function getEventStatusLabel(status: KsanEvent["status"]) {
  return status === "upcoming" ? "진행 예정" : "지난 행사";
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function parseEventMediaDescription(value: string) {
  const markerMatch = value.match(/\s*<!--ksan-event-media:([^>]*)-->\s*$/);
  if (!markerMatch) {
    return {
      agenda: [] as string[],
      applicationDeadline: null as string | null,
      audience: null as string | null,
      deleted: false,
      description: value,
      imageUrls: [] as string[],
      organizerLogo: null as string | null,
      organizerName: null as string | null,
      price: null as string | null,
      sourceId: null as string | null,
      sponsors: [] as Array<{ image?: string; name: string }>
    };
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(markerMatch[1] ?? "")) as {
      agenda?: unknown;
      applicationDeadline?: unknown;
      audience?: unknown;
      deleted?: unknown;
      imageUrls?: unknown;
      organizerLogo?: unknown;
      organizerName?: unknown;
      price?: unknown;
      sourceId?: unknown;
      sponsors?: unknown;
    };

    return {
      agenda: parseAgenda(parsed.agenda),
      applicationDeadline: typeof parsed.applicationDeadline === "string" && parsed.applicationDeadline.trim() ? parsed.applicationDeadline.trim() : null,
      audience: typeof parsed.audience === "string" && parsed.audience.trim() ? parsed.audience.trim() : null,
      deleted: parsed.deleted === true,
      description: value.slice(0, markerMatch.index).trim(),
      imageUrls: parseImageUrlList(parsed.imageUrls),
      organizerLogo: typeof parsed.organizerLogo === "string" && parsed.organizerLogo.trim() ? parsed.organizerLogo.trim() : null,
      organizerName: typeof parsed.organizerName === "string" && parsed.organizerName.trim() ? parsed.organizerName.trim() : null,
      price: typeof parsed.price === "string" && parsed.price.trim() ? parsed.price.trim() : null,
      sourceId: typeof parsed.sourceId === "string" ? parsed.sourceId : null,
      sponsors: sponsorsFromRow(parsed.sponsors)
    };
  } catch {
    return {
      agenda: [],
      applicationDeadline: null,
      audience: null,
      deleted: false,
      description: value.replace(markerMatch[0], "").trim(),
      imageUrls: [],
      organizerLogo: null,
      organizerName: null,
      price: null,
      sourceId: null,
      sponsors: []
    };
  }
}

export function isDeletedEventRow(row: EventTableRow) {
  return parseEventMediaDescription(row.description ?? "").deleted;
}

function parseImageUrlList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((url) => typeof url === "string" ? url.trim() : "").filter(Boolean);
}

function parseAgenda(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item.trim() : "").filter(Boolean);
  if (typeof value !== "string") return [];
  return value.split(/\n+/).map((item) => item.trim()).filter(Boolean);
}

function imageUrlsFromRow(row: EventTableRow) {
  const urls = [
    ...parseImageUrlList(row.image_urls),
    row.image_url
  ].map((url) => typeof url === "string" ? url.trim() : "").filter(Boolean);

  return Array.from(new Set(urls));
}

function sponsorsFromRow(value: unknown) {
  const rawSponsors = typeof value === "string"
    ? (() => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return [];
        }
      })()
    : value;

  if (!Array.isArray(rawSponsors)) return [];

  const sponsors: Array<{ image?: string; name: string }> = [];

  rawSponsors.forEach((sponsor, index) => {
    if (!sponsor || typeof sponsor !== "object") return;
    const item = sponsor as { image?: unknown; name?: unknown };
    const image = typeof item.image === "string" ? item.image.trim() : "";
    const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : `후원사 ${index + 1}`;
    if (image || name) sponsors.push({ image: image || undefined, name });
  });

  return sponsors;
}

export const ksanEvents: KsanEvent[] = ([
  {
    id: "uva-freshmen-ot-2026",
    title: "신입생 OT",
    summary: "새로운 동기와 선배를 만나 학교와 암스테르담 생활을 알아가는 첫 자리",
    description:
      "안녕하세요, 암스테르담 대학교 한인학생회 우바인(UvA-IN)입니다.\n\n2026-2027학년도 암스테르담에서 새 시작을 앞둔 여러분을 환영하기 위해 신입생 오리엔테이션(OT)을 준비했습니다. 신입생 OT를 통해 새로운 동기들과 소통하고, 학교와 암스테르담 생활에 유용한 정보도 얻는 기회가 되길 바랍니다!\n\n본 행사는 크게 2부로 구성되어 있습니다.",
    date: "2026-09-11",
    dateLabel: "2026.09.11 (금)",
    time: "1부 17:30–18:50 · 2부 19:00–",
    city: "Amsterdam",
    location: "1부: Roeterseiland Campus (자세한 장소는 추후 공지 예정)\n2부: CREA",
    mapQuery: "Roeterseiland Campus Amsterdam",
    keywords: ["신입생", "오리엔테이션"],
    status: "upcoming",
    image: "/images/events/uva-freshmen-ot-2026/cover.png",
    organizerName: "UvA-IN",
    organizerLogo: "/images/organizations/uva-in.jpg",
    registrationTarget: "https://docs.google.com/forms/d/e/1FAIpQLSemA5Fiz012BMPSEbztQo2IsNM-uwVhwORSHFfdX7xc4lPC1g/viewform",
    audience: "2026–2027학년도 암스테르담 대학교 신입생",
    agenda: [
      "1부 | 인포세션: 신입생들과 함께 앉아 서로를 알아가는 시간",
      "2부 | 네트워킹: 동기 및 선배들과 자유롭게 이야기하며 친해지는 시간"
    ]
  },
  {
    id: "ksan-freshmen-networking-2026",
    title: "2026 KSAN 신입생 네트워킹",
    summary: "첫 만남의 어색함을 풀고 새로운 인연을 만드는 네트워킹",
    description:
      "안녕하세요, 네덜란드 한국 학생회 [KSAN]입니다.\n\n낯선 네덜란드에서의 유학생활,\n새로운 사람들과의 첫 만남이 어렵게 느껴진다면?\n\nKSAN과 함께 더 편하게 시작해보세요!\n\n2026 KSAN 신입생 네트워킹 [첫 만남은 너무 어려워]가 돌아왔습니다.\n새로운 친구를 만나고 싶은 신입생부터 재학생, 교환학생 등 네덜란드에서 새로운 교류를 희망하는 분이라면 누구나 환영합니다!\n\n학교, 전공, 거주 지역에 관계없이 한자리에 모여 편하게 이야기하고,\n유학생활에 대한 정보도 나누며 새로운 인연을 만들어보세요.\n\n어색한 첫 만남을 풀어줄 아이스브레이킹과 미니게임,\n자유롭게 이야기를 나눌 수 있는 자유 네트워킹,\n그리고 놓칠 수 없는 상품 추첨까지!\n\n혼자 와도, 친구와 함께 와도 부담 없이 즐길 수 있도록 준비했으니\n많은 관심과 참여 부탁드립니다!",
    date: "2026-09-12",
    dateLabel: "2026.09.12",
    time: "16:00–20:00 (CEST)",
    city: "Amsterdam",
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
      "안녕하세요, 네덜란드 한국 학생회 [KSAN] 입니다.\n\n제 6회 KSAN 체육대회 ‘폭싹 뛰었수다’에 함께해주신 모든 분들께 진심으로 감사드립니다.\n여러분 덕분에 웃음과 열정이 가득한 특별한 하루가 되었습니다.\n\n이번 행사는 LG와 Shilla Market의 후원으로 더욱 풍성하게 진행될 수 있었는데요!\n다양한 지역에서 오신 분들과 소중한 인연도 만들고, 즐거운 추억도 많이 남기셨길 바랍니다.\n\n함께 뛰고, 응원하고, 웃었던 순간들 덕분에 이번 체육대회가 더욱 빛날 수 있었습니다.\n\n참여해주신 모든 분들께 감사드리며, KSAN은 앞으로도 다양하고 재밌는 행사로 여러분을 찾아뵙겠습니다 :)\n\n다음 KSAN 이벤트에서도 꼭 다시 만나요!",
    date: "2026-05-09",
    dateLabel: "2026.05.09",
    time: "Completed",
    city: "Netherlands",
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
    sponsors: [
      { name: "LG", image: "/images/partners/lg.png" },
      { name: "Shilla Market", image: "/images/partners/shilla-market.png" }
    ],
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
    city: "Netherlands",
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
    sponsors: [{ name: "농심", image: "/images/partners/nongshim.png" }],
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
    city: "Amsterdam",
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
      { name: "LG", image: "/images/partners/lg.png" },
      { name: "Ofood", image: "/images/partners/ofood.png" },
      { name: "Daesang Europe B.V.", image: "/images/partners/daesang-europe.png" },
      { name: "@jongga_eu", image: "/images/partners/jongga.png" },
      { name: "Bunq", image: "/images/partners/bunq.png" },
      { name: "Boko International", image: "/images/partners/boko.png" },
      { name: "@nl.esimmu", image: "/images/partners/esimmu.png" },
      { name: "NordVPN", image: "/images/partners/nordvpn.png" },
      { name: "네덜란드 한인회", image: "/images/partners/korean-society-netherlands.png" }
    ],
    audience: "신입생·재학생·교환학생·워홀러 및 네트워킹을 원하는 모든 분",
    agenda: []
  }
] satisfies KsanEvent[]).map((event) => ({
  ...event,
  status: getEventStatusByDate(event.date)
}));

export const upcomingEvents = ksanEvents.filter((event) => event.status === "upcoming");

export function getKsanEvent(id: string) {
  return ksanEvents.find((event) => event.id === id);
}

export function toKsanEventFromRow(row: EventTableRow): KsanEvent {
  const startsAt = safeEventDate(row.starts_at);
  const location = row.location?.trim() || "장소 추후 공지";
  const mediaDescription = parseEventMediaDescription(row.description?.trim() || "행사 설명을 준비 중입니다.");
  const description = mediaDescription.description || "행사 설명을 준비 중입니다.";
  const rowImageUrls = imageUrlsFromRow(row);
  const rowSponsors = sponsorsFromRow(row.sponsors);
  const imageUrls = rowImageUrls.length ? rowImageUrls : mediaDescription.imageUrls;
  const sponsors = rowSponsors.length ? rowSponsors : mediaDescription.sponsors;

  return {
    city: cityFromLocation(location),
    date: toIsoDate(startsAt),
    dateLabel: formatDateLabel(startsAt),
    description,
    id: row.source_id ?? mediaDescription.sourceId ?? row.id,
    image: imageUrls[0] ?? "/images/home-events/ksan-event-1.png",
    keywords: ["행사"],
    location,
    mapQuery: location,
    organizerLogo: mediaDescription.organizerLogo ?? "/images/ksan-logo-black.png",
    organizerName: mediaDescription.organizerName ?? "KSAN",
    photoCount: imageUrls.length || undefined,
    price: mediaDescription.price ?? undefined,
    recapImages: imageUrls.length > 1 ? imageUrls : undefined,
    registrationTarget: row.registration_target ?? undefined,
    sponsors: sponsors.length ? sponsors : undefined,
    status: getEventStatusByDate(startsAt),
    summary: firstSentence(description),
    time: eventTimeFormatter.format(startsAt),
    applicationDeadline: mediaDescription.applicationDeadline ?? undefined,
    audience: mediaDescription.audience ?? "KSAN 커뮤니티",
    agenda: mediaDescription.agenda,
    title: row.title
  };
}
